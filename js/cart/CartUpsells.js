// deps { ObserverLite , DomReadyPromise, parseHTML , GlobalCart } loaded globally
import { KSnavigation } from '../../assets/scripts.keenSlider.plugins';
export class CartUpsells extends HTMLElement {

  constructor() {
    super();
    this.ObserverLite = new ObserverLite()
    this.toggleLsKey = 'mdk8showUpsellItems'
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }

  connectedCallback() {
    DomReadyPromise().then( async () => {
      const settingsTemplete = this.querySelector(':scope > template')
      if(settingsTemplete){
        try{
          this.settings = JSON.parse(settingsTemplete.innerHTML)
          settingsTemplete.remove()
        }
        catch(err){
          console.error(err)
        }
        if(this.settings){
          
          const observer_key = this.attributes?.observer_key?.value || false
          if(observer_key){
            const observer$ = new ObserverLite({key:observer_key})
            this.ObserverLite.subscribe( (data) => {
              observer$.next(data)
            })
          }

          this.sidebarCartSection = this.closest('sidebar-cart-section')

          this.GlobalConditonalUpsellProducer = await new GlobalConditonalUpsellProducer()

          this.GlobalCart = await new GlobalCart()
          this.GlobalCart.subscribe( ({discrete}) => {
            if(!discrete){
              this.render()
            }
          })
          this.render()
        }
      }
    }).catch(err => {
      console.error(err)
    })
  }

  updateUi(){
    this.count.innerText = `(${this.itemsInCartArray.length}/${this.active.offer.max_items})`
    this.upsellElements.forEach((item) => {
      item.input.removeAttribute('disabled') 
      if(this.itemsInCartArray.length == this.active.offer.max_items && !item.selected){
        item.input.setAttribute('disabled',true) 
      }
    })
  }

  async updateCart(){

    this.sidebarCartSection.dataset.cart_ui_loading = true

    const itemsToRemove = this.active.offer.itemsInCart.filter(
      ({variant_id}) => !this.itemsInCartArray.includes(variant_id)
    ).map(({key}) => {
      return {
        key: key,
        quantity:0,
      }
    })
    
    let itemsToAdd = this.itemsInCartArray.filter(
      id => !this.active.offer.itemsInCart.some(({variant_id}) => id == variant_id)
    ).map( variant_id => {
      const item = this.active.offer.upsells.find(({id}) => id == variant_id)
      return {
        id:variant_id,
        quantity:1,
        properties:{
          _upsell_validation:JSON.stringify(item.validation)
        }
      }
    })

    if(itemsToRemove.length){
      await this.GlobalCart.updateQty(null,null,itemsToRemove,true)
    }

    if(itemsToAdd.length){
      itemsToAdd = {
        items:itemsToAdd
      }
      await this.GlobalCart.addToCart(itemsToAdd,false)
    }

    /* 
      This method updates the upsell producer and UI for this componant, but not the entrie
      cart UI ... 
      this is to stop the "jump" when sample line items above are added / removed from the
      cart items componant. Samples will show in the cart items componant on the next render 
      run. The alternate is to trigger GlobalCart.next() which will update any componants 
      that subscribe to it. Another opiton would be to not show samples / upsells in the 
      cart UI ... but then you have the issue of how to remove ones that have been added via
      an offer that is no longer being surfaced in this UI

    */
    this.GlobalConditonalUpsellProducer.updateOffers()
    this.sidebarCartSection.dataset.cart_ui_loading = false
    this.render()

  }
  
  render(){
    const validOffers = this.GlobalConditonalUpsellProducer.getValidOffers()
    let activeOffers = this.settings.offers.map(item  => {
      item.offer = validOffers.find(offer => offer.id == item.offer_id)
      return item.offer ? item : false
    }).filter( item => item )
    .sort((a,b) => a.offer.order - b.offer.order)
    
    const activeOffer = activeOffers.length ? activeOffers[0] : false

    if(!activeOffer){
      this.innerHTML = ''
      this.active = false
      this.setAttribute('hidden',true)
      this.next({ eventType:'ui:hidden' })
      return
    }

    this.removeAttribute('hidden')
    this.next({ eventType:'ui:show' })

    this.active = activeOffer
    this.itemsInCartArray = this.active.offer.itemsInCart.map(({variant_id}) => variant_id)
    this.updateHTML()
  }

  updateHTML(){
    const {active} = this
    const {section_settings, offers_initially_open} = this.settings
    this.showUpsellItems = sessionStorage.getItem(this.toggleLsKey);
    this.showUpsellItems = this.showUpsellItems === "true" ? true : this.showUpsellItems === "false" ? false : this.showUpsellItems;

    // If offers are set to open by default and no session storage exists, them open it
    if (this.showUpsellItems === null && offers_initially_open) {
      this.showUpsellItems = true
    }

    this.innerHTML = 
    `
      <div class="block-rel tac flex flex-grid--d2 column-nowrap">
        <h2 class="h-style f-w600 t-rm ls-5 lh-18 t-ucase flex row-wrap align-center justify-center flex-grid--d3">
          ${
            section_settings.title_icon ? (
              `
                <img 
                  class="sb-cart-upsell-title-icon" 
                  loading="lazy" 
                  width="64" 
                  height="64" 
                  alt="${section_settings.title_icon.alt || section_settings.title_text}"
                  src="${section_settings.title_icon.src || section_settings.title_icon }&width=64">
              `
            ) : ''
          }
          <span>${section_settings.title_text}</span>
        </h2>
        <details class="toggle-content-wrapper" ${this.showUpsellItems && 'open'}>
          <summary class="toggle-content-toggle">
            <span class="toggle-content-item--closed cell-l cell-r">
              <span class="sb-cart__btn btn btn--full t-ucase">${section_settings.button_text}</span>
            </span>
            <span aria-label="close" class="toggle-content-item--open toggle-content-close-icon sb-cart__close-chevron"></span>
          </summary>
          <div class="flex flex-grid-y--d2 column-nowrap">
            <h3 class="h-style t-xxs">${active.heading} <span class="js-cart-upsell-count f-w600">(${active.offer.itemsInCart.length}/${active.offer.max_items})</span></h3>
            <div>
              <div class="js-keen-slider keen-slider">
                ${
                  active.offer.upsells.map( item => {
                    return `
                      <div class="keen-slider__slide" ${this.itemsInCartArray.includes(item.id) ? 'data-active' : ''}>
                        <cart-upsell-item>
                          <template>
                            {
                              "item":${JSON.stringify(item)},
                              "maxItemsReached":${active.offer.maxItemsReached},
                              "translations":${JSON.stringify(this.settings.translations)}
                            }
                          </template>
                        </cart-upsell-item>
                      </div>
                    `
                  }).join('')
                }
                </div>
              </div>
            
              <div class="cell-l cell-r">
                <button class="js-add-upsells sb-cart__btn btn btn--full t-ucase">${section_settings.add_button_text}</button>
              </div>
            </div>
          </details>
        </div>
      `
    this.bind()
  }

  async bind(){
    // init keen slider
    const ksParams = {
      loop: false,
      slides: { 
        perView: 3,
        spacing: 18
      }
    }

    this.ksSlider = new KeenSlider(this.querySelector('.js-keen-slider'), ksParams,[KSnavigation])
    const globalSideBarCartUi$ = new ObserverLite({key:'GlobalSidebar.SidebarCart'})
    const globalSideBarCartUi = await globalSideBarCartUi$.once() 

    globalSideBarCartUi.subscribe( (data) => {
      setTimeout(() => {
        this.ksSlider.update()
      },500)
    })

    let activeIndex = 0
    const active = this.querySelector('[data-active]')
    if (active) {
      const parent = active.parentElement;
      const children = Array.from(parent.children)
      activeIndex = children.indexOf(active)
    } 

    this.ksSlider.moveToIdx(activeIndex)
    
    // bind controls
    this.toggleWrapper = this.querySelector('.js-cart-upsell__toggle-wrapper')
    this.toggle = this.querySelector('.js-cart-upsell__toggle')
    this.itemsWrap = this.querySelector('ITEMS')
    const details = this.querySelector('details')
    
    // Session storage updates when the user opens or closes the component
    details.addEventListener('click', (e) => {
      setTimeout(() => {
        sessionStorage.setItem(this.toggleLsKey, details.open)
      },0)
    })

    details.addEventListener('toggle', (e) => {
      const {oldState,newState} = e
      if (oldState == newState && oldState !== undefined) return

      if(details.open) {
        setTimeout(() => {
          this.ksSlider.update()
        },500)
      }
    })

    this.count = this.querySelector('.js-cart-upsell-count')
    
    this.upsellElements = [...this.querySelectorAll('cart-upsell-item')]
    this.upsellElements.forEach((el) => {
      el.subscribe(({item,selected}) => {
        const isInItemsInCartArray = this.itemsInCartArray.includes(item.id)
        if(!selected && isInItemsInCartArray){
          this.itemsInCartArray = this.itemsInCartArray.filter(id => id != item.id)
        }
        if(selected && !isInItemsInCartArray){
          this.itemsInCartArray.push(item.id)
        }
        this.updateUi()
      })
    })

    this.addBtn = this.querySelector('.js-add-upsells')
    if(this.addBtn){
      this.addBtn.addEventListener('click',(e) => {
        this.updateCart()
      })
    }
   
  }

}

customElements.define('cart-upsells', CartUpsells);


// deps { ObserverLite , DomReadyPromise, parseHTML , GlobalCart } loaded globally
import { KSnavigation } from '../../assets/scripts.keenSlider.plugins';
export class CartCrossSells extends HTMLElement {

  constructor() {
    super();
    this.ObserverLite = new ObserverLite()
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
          console.log(err)
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
          this.GlobalCart = await new GlobalCart()
          
          this.GlobalCart.subscribe( ({discrete}) => {
            if(!discrete){
              this.render()
              //this.ksSlider.update()
            }
          })

          this.render()
        }
      }
    }).catch(err => {
      console.log(err)
    })
  }


  safeProductsFIlter(products){
    return products.filter(({title}) => {
      const safe = 
      title.toLowerCase().includes('sample') ?
      false :
      true
      
      return safe
    })
  }


  getProducts(){
    return new Promise( async (resolve,reject) => {
      const products = this.safeProductsFIlter(this.GlobalCart.cart.items).reverse()
      const product = products[0]
      if(!product){
        resolve({err:'no product to fetch'})
        return
      }
      fetch(`${window.Shopify.routes.root}recommendations/products.json?product_id=${product.product_id}&limit=30&intent=related`)
      .then(response => response.json())
      .then(({ products }) => {
        const {section_settings} = this.settings
        products = this.safeProductsFIlter(products)
        products.length = products.length > section_settings.limit ? section_settings.limit : products.length
        resolve({products})
      }).catch(err =>{
        reject({err})
      })
    
    })
  }
  
  async render(){
   
    let {products,err} = await this.getProducts()
    
    if(err || !products?.length){
      this.setAttribute('hidden',true)
      this.next({ eventType:'ui:hidden' })
      return
    }

    this.removeAttribute('hidden')
    this.next({ eventType:'ui:show' })

    const {section_settings} = this.settings
    this.innerHTML = `
      <div class="block-rel cell-l cell-r tac row">
        <h2 class="h-style f-w600 t-rm ls-5 lh-18 t-ucase">${section_settings.title_text}</h2>
      </div>
      <div class="js-keen-slider keen-slider tac">
        ${
          products.map( product => {
            const {title,variants,featured_image,url} = product
            return  `
              <div class="keen-slider__slide">
                <cart-cross-sell-item class="d-block block-fh" >
                  <template>
                    {
                      "subscriptions":${JSON.stringify(this.settings.subscriptions)},
                      "translations":${JSON.stringify(this.settings.translations)},
                      "product":${JSON.stringify({
                        title,
                        variants,
                        featured_image,
                        url
                      })}
                    }
                  </template>
                </cart-cross-sell-item>
              </div>
            `
          }).join('')
        }
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
      },
      breakpoints: {
        '(max-width: 512px)': { 
          slides: { 
            perView: 2, 
            spacing: 12 
          } 
        }
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

  }

}

customElements.define('cart-cross-sells', CartCrossSells);


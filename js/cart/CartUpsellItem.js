// deps { ObserverLite , DomReadyPromise, parseHTML , GlobalCart } loaded globally
export class CartUpsellItem extends HTMLElement {

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
          const settings = JSON.parse(settingsTemplete.innerHTML)
          this.item = settings.item
          this.maxItemsReached = settings.maxItemsReached
          this.translations = settings.translations
          settingsTemplete.remove()
        }
        catch(err){
          console.log(err)
        }
        if(this.item){
          this.GlobalCart = await new GlobalCart()
          this.render()
        }
      }
    }).catch(err => {
      console.log(err)
    })
  }

  render(){
    const item = this.item
    // ${this.settings.maxItemsReached ? 'data-upsell-max' : ''}
    this.innerHTML =  
      `
        <div class="sb-cart-upsell-item block-rel">
          <input 
            type="checkbox" 
            name="sb-upsell" 
            aria-label="Select ${item.title}"
            class="sb-cart-upsell-item__input" 
            ${item.addedToBag ? 'checked' : '' }
            ${!item.addedToBag && this.maxItemsReached ? 'disabled' : ''}>

          <div class="sb-cart-upsell-item__content flex flex-grid--d3 column-nowrap">
            <div class="sb-cart-upsell-item__image">
              <img 
                src="${item.featured_image?.src || item.featured_image}?&width=256" 
                alt="${item.featured_image?.alt || item.title}" 
                loading="lazy" 
                width="128" 
                height="128">
            </div>
            <span class="d-block f-w600 t-xxxs ls-5 lh-18 t-ucase">${item.title}</span>
          </div>
        </div>
      `
    this.bind()
  }

  bind(){
    this.input = this.querySelector('input')
    this.addEventListener('change',(e) => {
      this.selected = this.input.checked
      this.next(this)
    })
  }

}

customElements.define('cart-upsell-item', CartUpsellItem);


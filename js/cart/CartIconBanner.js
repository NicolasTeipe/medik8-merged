// deps [parseHTML,ObserverLite,DomReadyPromise] loaded globally

export class CartIconBanner extends HTMLElement{
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
          this.settings = settings
          settingsTemplete.remove()
        }
        catch(err){
          console.log(err)
        }
        if(this.settings){
          // create a method to subscribe to a specific instance using an observer_key
          const observer_key = this.attributes?.observer_key?.value || false
          if(observer_key){
            const observer$ = new ObserverLite({key:observer_key})
            this.ObserverLite.subscribe( (data) => {
              observer$.next(data)
            })
          }
          this.GlobalCart = await new GlobalCart()          
          this.GlobalCart.subscribe( () => {
            this.render()
          })
          this.render()
        }
      }
    }).catch(err => {
      console.log(err)
    })
  }


  render(){ 
    let {total_price} = this.GlobalCart.cart
    const {blocks} = this.settings
    const activeBlocks = blocks.filter( ({threshold}) => (total_price/100) >= threshold )?.reverse() || false
    const currentBlock = activeBlocks ? activeBlocks[0] : false

    if(!currentBlock){
      this.tiers = false
      this.setAttribute('hidden',true)
      this.next({ eventType:'ui:hidden' })
      return
    }

    this.removeAttribute('hidden')
    this.next({ eventType:'ui:show' })
    
    this.innerHTML = `
      
    ${
      currentBlock.icon ? (
        `
          <img 
            class="sb-cart-banner__img" 
            loading="lazy" 
            width="64" 
            height="64" 
            alt="${currentBlock.icon.alt || false }"
            src="${currentBlock.icon.src || currentBlock.icon }&width=64">
        `
      ) : ''
    }
    <div class="sb-cart-banner__rte rte-content">${currentBlock.text}</div>
    `
  }
}

customElements.define('cart-icon-banner', CartIconBanner);



export class SidebarCart extends HTMLElement{
  constructor() {
    super()
  }

  connectedCallback() {
    DomReadyPromise().then( async () => {
      this.renderOnInit = this.attributes.render ? true : false
      let layouts = false
      const template = this.querySelector(':scope > template')
      if(template){
        try{
          layouts = Array.from(template.content.querySelectorAll('sidebar-cart-layout'))
        }
        catch(err){
          throw new Error(err)
        }
        template.remove()
      }else{
        layouts = Array.from(this.querySelectorAll('sidebar-cart-layout'))
      }

      if(!layouts.length){
        throw new Error('no layouts')
      }

      this.layouts = {
        empty:layouts.filter( ({attributes}) => attributes.empty || attributes.always),
        hasItems:layouts.filter( ({attributes}) => !attributes.empty  || attributes.always)
      }

      if(!this.layouts?.hasItems?.length){
        throw new Error('no layouts')
      }

      this.GlobalCart =  await new GlobalCart()
      this.GlobalCart.subscribe( () => {
        this.render()
      })

      if(this.renderOnInit){
        this.render()
      }
      
      const sidebar$ = new ObserverLite({key:'GlobalSidebar.SidebarCart'})
      this.SidebarCartWrapper = await sidebar$.once()
      const {render} = await this.SidebarCartWrapper.ObserverLite.once()
      if(render){
        this.render()
        this.SidebarCartWrapper.subscribe( ({render}) => {
          this.render()
        })
      }

      
    }).catch(err => {
      console.log(err)
    })
  }  

  async render(){
    const item_count = this.GlobalCart.cart.item_count
    const empty = this.empty || false
    if(!this.rendered || empty && item_count > 0 || !empty && item_count == 0){
      this.rendered = true
      this.empty = item_count == 0
      const activeLayouts = !item_count && this.layouts?.empty?.length ? this.layouts.empty : this.layouts.hasItems
      this.innerHTML = ''
      activeLayouts.forEach( layout => {
        const clone = layout.cloneNode(true)
        this.appendChild(clone)
      })
    }
  }
}

customElements.define('sidebar-cart', SidebarCart);


export class SidebarCartLayout extends HTMLElement{
  constructor() {
    super()
  }

  connectedCallback() {
    DomReadyPromise().then( async () => {
      this.init()
    }).catch(err => {
      console.log(err)
    })
  }  

  async init(){
    const CartSections = [...this.querySelectorAll('sidebar-cart-section')]
    const promises = CartSections.map( item => item.ObserverLite.once())
    await Promise.all(promises)
    this.cartSections = CartSections

    this.renderAllSections()
    
  }

  renderAllSections(){
    this.cartSections.forEach(cartSection => {
      cartSection.render()
    })
  }
}

customElements.define('sidebar-cart-layout', SidebarCartLayout);


export class SidebarCartSection extends HTMLElement{
  constructor() {
    super()
    this.ObserverLite = new ObserverLite()
  }
  
  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(changes){
    this.ObserverLite.next(changes)
  }

  connectedCallback() {
    if(this.connected){
      return
    }

    this.connected = true
    DomReadyPromise().then( async () => { 
      const template = this.querySelector(':scope > template[data-settings]')
      if(template){
        try{
          this.settings = JSON.parse(template.innerHTML)
        }
        catch(err){
          console.log(err)
          return 
        }
        template.remove()

        if(this.settings.dependancies?.length){
          const loader = new DynamicImporter(this.settings.dependancies)
          const loaded = await loader.load()
        }

        // use observers to catch any UI hidden events, e.g. when child compontant renders an empty / hidden element rather than removing itself from dom
        if(this.settings.observer_key){
          const observer$ = new ObserverLite({key: this.settings.observer_key})
          observer$.subscribe( data => {
            if(data?.eventType == 'ui:hidden'){
              this.setAttribute('hidden',true)
            }else{
              this.removeAttribute('hidden')
            }
          })
        }


        this.unwrap()
        const content = this.querySelector(':scope > template[data-content]')
        this.contentHTML = content?.innerHTML || false

        if(!this.contentHTML){
          this.remove()
          this.next()
          return
        }

        this.next()
  
        this.GlobalCart = this.GlobalCart || await new GlobalCart()
        this.GlobalCart.subscribe( async () => {
          if(this.settings.dynamicLiquid){
            this.contentHTML = await this.getUpdatedHTML()
            if(this.rendered){
              this.render()
            }
          }
        })
        
      }      
    }).catch(err => {
      console.log(err)
    })
  }  

  getUpdatedHTML(){
    return new Promise((resolve,reject) => {
      fetch(`${window.Shopify.routes.root}?sections=${this.settings.id}`)
      .then(res => res.json())
      .then(data => {
        let section = data[this.settings.id]
        section = parseHTML(section)
        const content = section.querySelector('[data-content]')
        resolve(content.innerHTML)
      })
    })
  }

  unwrap() {
    if (this.parentNode.id === `shopify-section-${this.settings.id}`) {
      const parent = this.parentNode
      while (parent.firstChild) {
        parent.parentNode.insertBefore(parent.firstChild, parent)
      }
      parent.remove()
    }
  }

  async render(){
    this.innerHTML = this.contentHTML
    this.rendered = true  
  }

}

customElements.define('sidebar-cart-section', SidebarCartSection);

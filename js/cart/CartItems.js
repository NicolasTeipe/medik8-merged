import { ObserverLite } from "../ObserverLite"

// deps [parseHTML,ObserverLite,DomReadyPromise] loaded globally
export class CartItems extends HTMLElement{
  constructor() {
    super()
  }

  async connectedCallback() {
    if(this.connected){
      return
    }
    this.globalObserver$ = new ObserverLite({key:'GlobalSidebar.SidebarCart.Sections.CartItems'})
    this.connected = true
    DomReadyPromise().then( async () => { 
      const template = this.querySelector(':scope > template')
      if(template){
        try{
          this.settings = JSON.parse(template.innerHTML)
        }
        catch(err){
          console.log(err)
          return 
        }
        template.remove()
        this.GlobalCart = await new GlobalCart()
        this.render()
        this.GlobalCart.subscribe( ({discrete}) => {
          if(!discrete){
            this.render()
          }
        })
      }

    }).catch(err => {
      console.log(err)
    })
  }


  render(){ 

    const {
      items
    } = this.GlobalCart.cart

    this.innerHTML = items.length ? (
      items.map( (item,index) => {

        if(item){
          const {
            product_title,
            variant_title,
            options_with_values,
            variant_options,
            image,
            url,
            discounts,
            line,
            key,
            quantity,
            final_line_price,
            original_line_price,
            properties,
            selling_plan_group,
            selling_plan_allocation,
            badge
          } = item

          const newItem = {
            product_title,
            variant_title,
            options_with_values,
            variant_options,
            image,
            url,
            discounts,
            line,
            key,
            quantity,
            final_line_price,
            original_line_price,
            properties,
            selling_plan_group,
            selling_plan_allocation,
            badge
          }
          return (
            `
              <cart-line-item class="flex-grid--d2 flex column-nowrap">
                <template data-settings>
                  {
                    "line_item":${JSON.stringify(newItem)},
                    "translations":${JSON.stringify(this.settings.translations)},
                    "subscriptions":${JSON.stringify(this.settings.subscriptions)}
                  }
                </template>
              </cart-line-item>
            `
          )
        }
      }).join('')
    ) : (
      `
        <div class="tac cell-l cell-r flex column-nowrap align-center justify-center flex-grid">
          <h2 class="h-style t-m">${this.settings.empty.cart_empty_header}</h2>
          <div class="t-grey lh-r t-rm empty-cart-message">${this.settings.empty.cart_empty_message}</div>
          <a class="btn btn--large" href="${
            this.settings.empty.cart_empty_cta_url?.length ? 
            this.settings.empty.cart_empty_cta_url : 
            '/'
          }">${this.settings.empty.cart_empty_cta_text}</a>
        </div>
      `
    )

    this.globalObserver$.next(this)
  }
}
customElements.define('cart-items', CartItems);

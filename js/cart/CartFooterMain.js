// deps [parseHTML,ObserverLite,DomReadyPromise] loaded globally

export class CartFooterMain extends HTMLElement{
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

  decodeHtmlString(string) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = string;
    return textArea.value;
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
          this.GlobalCart = await new GlobalCart()          
          this.GlobalCart.subscribe( () => {
            this.render()
          })
          this.render()

          this.GlobalCart.requestQueues$.subscribe( (qSize) => {
            this.updateState(qSize > 0)
          })
        }
      }
    }).catch(err => {
      console.log(err)
    })
  }

  updateState(loading){
    this.total_el = this.querySelector('.js-sb-cart-footer__total')
    if(this.total_el){
      this.total_el.dataset.cart_ui_thinking_text = loading
    }
    this.points_el =  this.querySelector('.js-sb-cart-footer__points')
    if(this.points_el){
      this.points_el.dataset.cart_ui_thinking_text = loading
    }
    this.button_el = this.querySelector('.js-sb-cart-footer__btn')
    if(this.button_el){
      this.button_el.dataset.cart_ui_thinking_button = loading
    }
  }


  render(){ 
    const {total_price,original_total_price,item_count} = this.GlobalCart.cart

    if(!item_count){
      this.innerHTML = ''
      this.setAttribute('hidden',true)
      this.next({ eventType:'ui:hidden' })
      return
    }

    this.removeAttribute('hidden')
    this.next({ eventType:'ui:show' })
    
    if(this.settings.dv2_fg__show && this.GlobalCart.freeGiftToggle){
      this.GlobalCart.freeGiftToggle.show = true 
    }

    this.innerHTML = 
      `
        <form action="/cart" method="post" class="flex flex-grid--d3 column-nowrap">
          <div class="flex row-wrap align-center justify-space flex-grid--d2 t-ucase f-w600 ls-5 lh-18 t-ucase t-rm">
            <span class="">${this.settings.total_text}</span>
            <div class="js-sb-cart-footer__total flex row-wrap align-bottom justify-right flex-grid--d3">
              ${
                original_total_price != total_price ? (
                  `<span class="f-w400 t-xxs t-grey"><s>${this.GlobalCart.ShopifyUtils.formatMoney(original_total_price)}</s></span>`
                ) : ''
              }
              <span>${this.GlobalCart.ShopifyUtils.formatMoney(total_price)}</span>
            </div>
          </div>
          ${
            this.settings.lp__show && this.settings.lp__label?.length ? (
              `
                <div class="flex row-wrap align-center justify-space flex-grid--d2">
                  <span class="flex row-wrap align-center justify-left flex-grid--d2">
                    <span class="sb-cart-ll-points">${this.settings.lp__label}</span>
                    <button class="d-block js-sb-cart-footer__hint-toggle sb-cart-footer__hint-toggle" type="button">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.5 13.5H9.5V8H8.5V13.5ZM9 6.57693C9.17437 6.57693 9.32053 6.51795 9.43848 6.4C9.55641 6.28205 9.61537 6.13589 9.61537 5.96152C9.61537 5.78718 9.55641 5.64102 9.43848 5.52307C9.32053 5.40512 9.17437 5.34615 9 5.34615C8.82563 5.34615 8.67948 5.40512 8.56153 5.52307C8.44359 5.64102 8.38463 5.78718 8.38463 5.96152C8.38463 6.13589 8.44359 6.28205 8.56153 6.4C8.67948 6.51795 8.82563 6.57693 9 6.57693ZM9.00335 18C7.7588 18 6.58872 17.7638 5.4931 17.2915C4.39748 16.8192 3.44444 16.1782 2.63397 15.3685C1.82352 14.5588 1.18192 13.6066 0.70915 12.512C0.236383 11.4174 0 10.2479 0 9.00335C0 7.7588 0.236158 6.58872 0.708475 5.4931C1.18081 4.39748 1.82183 3.44444 2.63153 2.63398C3.44123 1.82353 4.39337 1.18192 5.48795 0.709151C6.58255 0.236384 7.75212 0 8.99665 0C10.2412 0 11.4113 0.236158 12.5069 0.708475C13.6025 1.18081 14.5556 1.82182 15.366 2.63152C16.1765 3.44122 16.8181 4.39337 17.2908 5.48795C17.7636 6.58255 18 7.75212 18 8.99665C18 10.2412 17.7638 11.4113 17.2915 12.5069C16.8192 13.6025 16.1782 14.5556 15.3685 15.366C14.5588 16.1765 13.6066 16.8181 12.512 17.2909C11.4174 17.7636 10.2479 18 9.00335 18ZM9 17C11.2333 17 13.125 16.225 14.675 14.675C16.225 13.125 17 11.2333 17 9C17 6.76667 16.225 4.875 14.675 3.325C13.125 1.775 11.2333 1 9 1C6.76667 1 4.875 1.775 3.325 3.325C1.775 4.875 1 6.76667 1 9C1 11.2333 1.775 13.125 3.325 14.675C4.875 16.225 6.76667 17 9 17Z" fill="black"/>
                      </svg>
                    </button>
                  </span>
                  <span class="js-sb-cart-footer__points">${Math.floor(total_price / 100)}</span>
                  <div class="js-sb-cart-footer__hint-text sb-cart-footer__hint-text block-12/12 t-xxs bdr-t bdr-grey-mid ct--d2 block-rel">
                    <button class="js-sb-cart-footer__hint-toggle sb-cart-footer__hint-text-close sb-cart__close-x"></button>
                    ${this.decodeHtmlString(this.settings.lp__hint)}
                  </div>
                </div>
              `
            ) : ''
          }
          ${ 
            this.settings.dv2_fg__show && this.GlobalCart.freeGiftToggle ? (
              `
              <global-freegift-toggle hidden>
                  <template>
                    ${JSON.stringify(
                      {
                        gift_remove__text:this.settings.dv2_fg__label,
                        remove__tooltip:this.settings.dv2_fg__tooltip
                      }
                    )}
                  </template>
                </global-freegift-toggle>
              `
            ) : ''  
          } 
          <button 
            name="checkout" 
            class="sb-cart-footer__btn js-sb-cart-footer__btn btn btn--secondary btn--full">
              ${this.settings.button_text}
          </button>
        </form>
      `

    this.bind()
  }

  bind(){
    this.lp_content = this.querySelector('.js-sb-cart-footer__hint-text')

    if(!this.lp_content){
      return
    }

    this.querySelectorAll('.js-sb-cart-footer__hint-toggle').forEach(
      el => el.addEventListener('click',(e) => {
        e.preventDefault();
        this.lp_content.style.display = this.lp_content.style.display == 'block' ? 'none' : 'block'
      })
    )
  }
}

customElements.define('cart-footer-main', CartFooterMain);

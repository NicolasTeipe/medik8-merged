// deps [parseHTML,ObserverLite,DomReadyPromise] loaded globally

export class CartCrossSellItem extends HTMLElement{
  constructor() {
    super();
  }

  connectedCallback() {
    DomReadyPromise().then( async () => {
      const settingsTemplete = this.querySelector(':scope > template')
      
      if(settingsTemplete){
        try{
          const settings = JSON.parse(settingsTemplete.innerHTML)
          this.product = settings.product
          this.translations = settings.translations
          this.subscriptions = settings.subscriptions
          settingsTemplete.remove()
        }
        catch(err){
          console.log(err)
        }
        if(this.product){
          this.GlobalCart = await new GlobalCart()
          this.render()
        }
      }
    }).catch(err => {
      console.log(err)
    })
  }

  async onAtcClick(){
    this.dataset.cart_ui_loading = true
    const itemsToAdd = {
      items:[
        {
          id:this.variant.id,
          quantity:1
        }
      ]
    }

    this.GlobalCart.addToCart(itemsToAdd,false).then( () => {
      this.render()
    }).catch(err => {
      let message = err?.data?.description ? err.data.description : false
      this.render(message)
    })
  }


  updateSelectedVariant(){
    this.variant = this.variant || this.product.variants[0]
    this.variant.inCart = this.GlobalCart.getLineItemsByVariantId(this.variant.id)
    this.variant.inCartTotals = this.variant.inCart.map(({quantity}) => quantity).reduce((a, b) => a + b, 0)
  }

  bind(){ 
   
    this.errorMessage = this.querySelector('.js-x-sell-message')
    if(this.errorMessage){
      clearTimeout(this.errorMessageTimeout)
      this.errorMessageTimeout = setTimeout(() => {
        this.errorMessage.remove()
      },3000)
    }
    this.atc = this.querySelector('.js-x-sell-add')
    this.atc.addEventListener('click',(e) => {
      e.preventDefault()
      this.onAtcClick()
    })


    this.select = this.querySelector('select')
    
    if(this.select){
      this.select.addEventListener('change',() => {
        const variant_id = this.select.value
        const variant = this.product.variants.find(({id}) => id == variant_id)
        if(variant){
          this.variant = variant
          this.render()
        }
      })
    }

  }


  async geThumbmainHTML(message){
    this.updateSelectedVariant()
    let {price,compare_at_price,id,inCart,inCartTotals} = this.variant
    inCart = inCart.length ? inCart[0] : false
    const image = this.variant.featured_image || this.product.featured_image
    const url = `${this.product.url}&variant=${id}`
    
    let comp_price = compare_at_price
    // plug in the subscription price
    if(inCart){
      comp_price = price
      price = inCart.original_price
    }
    const {currency_symbol} = this.GlobalCart
    const thumbmain = `
      <div class="block-mfrh flex flex-grid-y--d3 column-nowrap justify-top align-center">
        <a class="flex flex-grid-y--d3 column-nowrap justify-left align-center flex-fill-height block-12/12" href="${url}">
          <div class="block-rel block-12/12">
            <img 
              class="block-12/12 d-block"
              src="${image.src || image }?&width=128" 
              alt="${image.alt || this.product.title}" 
              loading="lazy" 
              width="128" 
              height="128">
          </div>
            <div class="flex flex-grid-y--d3 column-nowrap justify-space align-center  block-12/12">
              <span class="block-12/12 f-w600 t-xxxs ls-5 lh-18 t-ucase">${this.product.title}</span>
            </div>
        </a>
        <div class="flex flex-grid-y--d3 column-nowrap justify-space align-center block-12/12">
          ${this.smallSelectHtml}
          <div class="t-xxs ls-5 lh-18 flex row-wrap align-bottom justify-center">
            ${await this.#buildPrice(id, price, compare_at_price)}
          </div>
        
          <button 
              class="js-x-sell-add btn sb-cart__btn btn--wfocus-state block-10/12" 
              ${inCartTotals == 6 || !this.variant.available ? 'disabled' : ''}
            >
            
              <span>${this.translations.add}</span>
            </button>
     
        </div>
      </div>
        ${message ? (
          `<span class="js-x-sell-message t-xxs sb-cart-item__error tac">${message}</span>`
          ) : ''
        }
        
    `
    return thumbmain
  }

  get smallSelectHtml(){
    return `
      ${
        this.product.variants.length > 1 ? (
         `
            <select name="option_select" class="block-12/12 select-alt-style select-alt-style--xs">
              ${
                this.product.variants.filter(({available}) => available).map( variant => 
                  `<option value="${variant.id}" ${variant.id == this.variant.id ? 'selected' : ''}>${variant.options.join(' / ')}</option>`
                ).join('')
              }
            </select>
          `
        ) : ''
      }
    `
  }

  async #buildPrice(id, price, compare) {
    const priceFontWeight = compare ? ' f-w600' : ''
    const priceActual = `<span class='price-v2__${Number(
      id
    )}${priceFontWeight}'>${this.GlobalCart.ShopifyUtils.formatMoney(price)}</span>`;

    let priceHtmlStr = compare
      ? `<s class="cell-r--d3">${this.GlobalCart.ShopifyUtils.formatMoney(
          compare
        )}</s>${priceActual}`
      : priceActual;

    if (sitewide) {
      priceHtmlStr = await sitewide.updateGlobalProductPriceV2(
        String(id),
        priceHtmlStr
      );
    }

    return priceHtmlStr;
  }


  async render(message){ 
    this.dataset.cart_ui_loading = false
    this.innerHTML = await this.geThumbmainHTML(message)
    this.bind()
  }
}

customElements.define('cart-cross-sell-item', CartCrossSellItem);

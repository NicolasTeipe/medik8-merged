import { ShopifyUtils } from "../ShopifyUtils"
//deps { ObserverLite } loaded in core

export class GlobalProductThumbnail extends HTMLElement {

  constructor() { 
    super()
    this.ObserverLite = new ObserverLite()

    const money_format = `${window.cartCurrencySymbol}{{amount_optional_decimals}}`;
    this.ShopifyUtils = new ShopifyUtils({
      money_format: money_format,
    });
  }

  connectedCallback(){
    DomReadyPromise().then( async () => {
      const settingsTemplete = this.querySelector(':scope > template')
      if(settingsTemplete){
        try{
          this.settings = JSON.parse(settingsTemplete.innerHTML)
          settingsTemplete.remove()
        }
        catch(err){
          this.remove()
          return
        }
      }

      this.mount()
      this.GlobalCart = await new GlobalCart()
      if(this.settings){
        this.innerHTML = await this.getHtmlTemplate()
      }
      this.bind()
    }).catch(err => {
      console.error(err)
    })
  }

  mount(){
    if(!window.GlobalProductThumbnailMounted){
      const style = `
        <style type="text/css">
          global-product-thumbnail{
            text-align:center;
          }

          .global-product-thumbnail__img-wrapper{
            box-shadow:0 3px 15px #0000001a;
            margin-bottom:10px;
            position:relative;
          }

          .global-product-thumbnail__quickview{
            background: #000;
            bottom: 24px;
            color: #fff;
            font-size: 13px;
            left: 50%;
            letter-spacing: 1px;
            line-height:16px;
            margin: 0 auto;
            opacity: 0;
            pointer-events: none;
            position: absolute;
            text-align: center;
            text-transform: uppercase;
            transition: .2s ease-in-out;
            transform:translate(-50%,0%);
            padding:var(--gutter-unit-d2);
            min-width:182px;
            max-width:100%;
          }

          .global-product-thumbnail__img-wrapper:hover .global-product-thumbnail__quickview{
            opacity:1;
            pointer-events: auto;
          }
          
        </style>
      `
      window.GlobalProductThumbnailMounted = true
      document.body.append(parseHTML(style))
    }
  }

  createResponsiveImage({ src, alt, sizes, width, classList }) {
    sizes = sizes || [512,256,128]
    const getSeparator = url => url.includes('?') ? '&' : '?'
    const srcset = sizes.map(size => `${src}${getSeparator(src)}w=${size} ${size}w`).join(', ')
    const imgHtml = `
      <img 
        srcset="${srcset}" 
        alt="${alt}"  
        width="${width}" 
        height="${width}" 
        class="${classList}"
        loading="lazy">
     `
    return imgHtml
  }

  async buildPrice(product){
    const priceActual = `<span class='price-v2__${
      Number(product.objectID)
    }'>${this.ShopifyUtils.formatMoney(product.price*100)}</span>`;

    let priceHtmlStr = product.compare_at_price
      ? `<s>${this.ShopifyUtils.formatMoney(product.compare_at_price*100)}</s>${priceActual}`
      : priceActual;

    if (sitewide) {
      priceHtmlStr = await sitewide.updateGlobalProductPriceV2(
        product.objectID,
        priceHtmlStr
      )
    }

    return priceHtmlStr
  }

  async buildLabel(product) {
    const badge = product.meta?.custom?.badge || null
    const labelContent = product.compare_at_price
      ? this.settings.translations.compare_label
      : badge;

    let labelHtmlStr = labelContent
      ? `<span class='badge-v2 badge-v2__product-card' aria-label='${labelContent}'>${labelContent}</span>`
      : '';

    if (sitewide) {
      labelHtmlStr = await sitewide.updateGlobalProductThumbnailLabelV2(
        product.objectID,
        labelHtmlStr
      )
    }

    return labelHtmlStr
  }

  async bind(){
    this.quickViewToggle = this.querySelector('[data-product]')
    this.quickViewToggle?.addEventListener('click',(e) => {
      e.preventDefault()
      // window.onQuickViewClick is on quick-view-item-script todo - consolodate quick view into global product thumbnail. This should be done when all thumbnails have been refactored into single instance of custom el
      window.onQuickViewClick(this.quickViewToggle)
    })
    this.yotpoButton = this.querySelector('.js-prod-thumb-yotpo')
    this.yotpoButton?.addEventListener('click',(e) => {
      e.preventDefault()
      const {handle} = this.yotpoButton.dataset
      window.location.href = handle
    })
    this.ObserverLite.next()
  }

  buildReviews(product) {
    return `
      <div class="yotpo-widget-instance no-events" data-yotpo-instance-id="${window?.yotpoStarsInstanceId}" data-yotpo-product-id="${product.id}" data-yotpo-cart-product-id="" data-yotpo-section-id="${window?.yotpoSectionId}"></div>
    `
  }

  async getHtmlTemplate(){
    const {product} = this.settings

    const variantActionButton =
    product.product_type === 'Bundles'
      ? `<button class="btn--full btn--outline">
          <span class="text">${this.settings.translations.view_bundle}</span>
        </button>`
      : `<form action="/cart/add" method="post" enctype="multipart/form-data">
          <input type="hidden" name="id" value="${product.objectID}">
          <input min="1" type="hidden" name="quantity" value="1" data-variant-id="${product.objectID}" data-variant-inventory-qty="${product.inventory_quantity}">
          <button class="btn--full btn--outline" onclick="GlobalCartMain.addProductFromButton(event)">
            <span class="text">${this.settings.translations.add_to_cart}</span>
          </button>
        </form>`;

    const productTitle =
      product.variant_title &&
      !product.variant_title.includes('Default') &&
      product.variant_title != product.title
        ? product.variant_title
        : product.title;

    return `
      <div class="flex flex-grid--d2 column-nowrap justify-space block-fh">
        <div class="flex flex-grid--d2 column-nowrap grow-1">
          <span class="global-product-thumbnail__img-wrapper">
            <a href="/products/${product.handle}?variant=${product.objectID}">
              <div class="label-wrapper label-wrapper__${product.objectID}" data-type="product-card"
                aria-label="Label for ${productTitle}">
                ${await this.buildLabel(product)}
              </div>
              ${this.createResponsiveImage({
                src:product.image,
                alt:product.title,
                width:512,
                classList:'d-block'
              })}
            </a>
            <button class="global-product-thumbnail__quickview @tablet__hide" data-product="/products/${product.handle}?variant=${product.objectID}">
              ${this.settings.translations.quickview}
            </button>
          </span>
          <a href="/products/${product.handle}?variant=${product.objectID}" class="flex flex-grid--d2 column-nowrap grow-1 justify-space">
            <span class="t-ucase ls-2 t-rm lh-20">
              ${productTitle}
            </span>
            ${product.meta?.sf_product_hero?.sub_heading ? (
              `<span class="ls-1_5 t-grey-1 t-xxxs lh-16">${product.meta.sf_product_hero.sub_heading}</span>`
            ) : ''}
          </a>
        </div>
        <div class="flex flex-grid--d2 column-nowrap">
          <span class="ls-1_5 t-xxxs t-grey-1 lh-16">
            ${await this.buildPrice(product)}
          </span>
          <button 
            class="js-prod-thumb-yotpo block-12/12 flex justify-center" 
            data-handle="/products/${product.handle}?variant=${product.objectID}#shopify-section-product-reviews-js">
            ${this.buildReviews(product)}
          </button>
          ${variantActionButton}
        </div>
      </div>
    `
  }
}

customElements.define('global-product-thumbnail', GlobalProductThumbnail);

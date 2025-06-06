import { ShopifyUtils } from '../../ShopifyUtils';
//deps { ObserverLite } loaded in core

export class GlobalProductCard extends HTMLElement {
  constructor() {
    super();
    this.ObserverLite = new ObserverLite();

    const money_format = `${window.cartCurrencySymbol}{{amount_optional_decimals}}`;
    this.ShopifyUtils = new ShopifyUtils({
      money_format: money_format,
    });
  }

  connectedCallback() {
    DomReadyPromise()
      .then(async () => {
        const settingsTemplate = this.querySelector(':scope > template');

        if (settingsTemplate) {
          try {
            this.settings = JSON.parse(settingsTemplate.innerHTML);
            settingsTemplate.remove();
          } catch (err) {
            console.log(err);
            this.remove();
            return;
          }
        }

        this.#mount();
        if (this.settings) {
          this.innerHTML = await this.#getHtmlTemplate();
        }
        this.#bind();
      })
      .catch(err => {
        console.log(err);
      });
  }

  #mount() {
    if (!window.GlobalProductCardMounted) {
      const style = `
        <style type="text/css">
          .gpc__img-wrapper{
            margin:10px 0;
            position:relative;
          }

          global-product-card .hover-img {
            position: absolute;
            top: 0;
            z-index: -1;
            opacity: 0;
          }

          @media all and (min-width: 768px) {
            global-product-card:hover .hover-img {
              z-index: 1;
              opacity: 1;
            }

            global-product-card:hover .gpc__badge {
              display: none;
            }

            global-product-card:hover .gpc__button-bar {
              display: flex;
              flex-direction: column-reverse;
            }

            global-product-card:not(:hover) .gpc__wishlist{
              opacity: 0;
            }
          }

          global-product-card #loyaltylion .lion-action-button {
            background: black;
            width: 100%;
          }

          global-product-card #loyaltylion .lion-action-button--disabled {
            background: var(--grey);
            border-color: var(--grey);
          }

          @media all and (min-width: 1100px) {
            global-product-card:hover .gpc__button-bar {
              flex-direction: row;
            }
          }

          .gpc__badge {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: #F6F6F6;
            border-radius: 5px;
            padding: 4px 12px;
          }

          .template-index.dark-mode .gpc__badge {
            background: var(--body-Background);
          }

          .gpc__button-bar {
            display: none;
            position: absolute;
            bottom: 0px;
            gap: 15px;
            padding: 0 15px 15px;
            z-index: 10;
          }

          .gpc__button-bar--redemption {
            display: block;
          }

          .gpc__button {
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1px solid #000;
            border-radius: 5px;
            min-height: 3em;
            line-height: normal;
          }

          .gpc__button--primary {
            background: #000;
            color: #FFF;
          }

          .gpc__button--primary:hover {
            background: #FFF;
            color: #000;
            transition: all .1s ease-in;
          }

          .gpc__button--secondary {
            background: #FFF;
            color: #000;
          }

          .gpc__button--secondary:hover {
            background: #000;
            color: #FFF;
            transition: all .1s ease-in;
          }         
            
          .gpc__size--separator::after {
            content: "|";
            padding: 0 7px 0 4px;
          }

          .gpc__wishlist {
            position: absolute;
            top: 18px;
            right: 8px;
            z-index: 3;
          }

          .gpc__wishlist-wrapper {
            background: #FFFFFFCC;
            width: 24px;
            height: 24px;
            border-radius: 50%;
          }

          .gpc__wishlist-wrapper button {
            margin-top: 2px !important;
          }

          .gpc__wishlist-wrapper .swym-button.swym-add-to-wishlist-view-product.swym-added {
            opacity: 1;
          }

          .gpc__atb-btn {
            position: absolute;
            right: 5px;
            bottom: 5px;
            background:#fff;
            width:28px;
            height:28px;
          }

          @media all and (min-width: 768px) {
            .gpc__atb-btn {
              display: none;
            }
          }
        </style>
      `;
      window.GlobalProductCardMounted = true;
      document.body.append(parseHTML(style));
    }
  }

  async #bind() {
    this.quickViewToggle = this.querySelector('[data-product]');
    this.quickViewToggle?.addEventListener('click', e => {
      e.preventDefault();
      window.onQuickViewClick(this.quickViewToggle);
    });

    this.GlobalCart = await new GlobalCart()

    const gpcAddToBagButton = this.querySelector('.gpc__atb-btn')
    gpcAddToBagButton.addEventListener('click',(e) => {
      gpcAddToBagButton.disabled = true
      gpcAddToBagButton.dataset.loading = true
      const data = {
        items:[
          {
            id:this.settings.product.id,
            quantity:1,
          }
        ]
      }
      this.GlobalCart.addToCart(data).then( () => {
        gpcAddToBagButton.disabled = false
        gpcAddToBagButton.dataset.loading = false
      })
    })


    this.ObserverLite.next();
  }

  #createResponsiveImage({ src, alt, sizes, width, classList }) {
    sizes = sizes || [512, 256, 128];
    const getSeparator = url => (url.includes('?') ? '&' : '?');
    const srcset = sizes
      .map(size => `${src}${getSeparator(src)} ${size}w`)
      .join(', ');
    const imgHtml = `
      <img 
        srcset="${srcset}" 
        alt="${alt}"  
        width="${width}" 
        height="${width}" 
        class="${classList}"
        loading="lazy">
    `;
    return imgHtml;
  }

  async #buildPrice(product) {
    const priceFontWeight = product.compare ? ' f-w600' : ''
    const priceActual = `<span class='price-v2__${Number(
      product.id
    )}${priceFontWeight}'>${this.ShopifyUtils.formatMoney(product.price)}</span>`;

    let priceHtmlStr = product.compare
      ? `<s class="cell-r--d3">${this.ShopifyUtils.formatMoney(
          product.compare
        )}</s>${priceActual}`
      : priceActual;

    if (sitewide) {
      priceHtmlStr = await sitewide.updateGlobalProductPriceV2(
        product.id,
        priceHtmlStr
      );
    }

    const size =
      (product.size_variant != '0' && product.size_variant) ||
      product.size_product;
    const sizeHtmlStr = size ? `<span class="gpc__size--separator">${size}</span>` : ''

    return `${sizeHtmlStr}${priceHtmlStr}`;
  }

  async #buildLabel(product, variantTitle) {
    let badgeText = product.compare || product.badge;
    let labelHtmlStr = badgeText
      ? `<span class='badge-v2 badge-v2__product-card block-z3' aria-label='${badgeText}'>${badgeText}</span>`
      : '';

    if (sitewide) {
      labelHtmlStr = await sitewide.updateGlobalProductThumbnailLabelV2(
        product.id,
        labelHtmlStr
      );
    }

    return `
      <div class="label-wrapper label-wrapper__${
        product.id
        }" data-type="product-card"
        aria-label="Label for ${variantTitle}">
        ${labelHtmlStr}
      </div>
    `
  }

  #buildVariantAddToBagButton(product) {
    return product.product_type === 'Bundles'
    ? `<button class="btn--full gpc__button gpc__button--primary t-ucase t-xxs">
      <span class="text">${this.settings.translations.view_bundle}</span>
    </button>`
    : `<form action="/cart/add" method="post" enctype="multipart/form-data" class="flex_1">
      <input type="hidden" name="id" value="${product.id}">
      <input min="1" type="hidden" name="quantity" value="1" data-variant-id="${product.id}" data-variant-inventory-qty="${product.inventory_quantity}">
      <button class="btn--full gpc__button gpc__button--primary t-ucase t-xxs" onclick="GlobalCartMain.addProductFromButton(event)" aria-label="Add To Bag">
        <span class="text">${this.settings.translations.add_to_cart}</span>
      </button>
    </form>`;
  }

  #buildQuickViewButton(product) {
    return `
      <button class="btn--full gpc__button gpc__button--secondary flex_1 t-ucase t-xxs" data-product="/products/${product.handle_product}?variant=${product.id}">
        ${this.settings.translations.quickview}
      </button>
    `
  }

  buildReviews(product) {
    return `
      <a href="/products/${product.handle_product}#shopify-section-product-reviews-js" class="hotspot-reviews">
        <div class="yotpo-widget-instance no-events" data-yotpo-instance-id="${window?.yotpoStarsInstanceId}" data-yotpo-product-id="${product.id_product}" data-yotpo-cart-product-id="" data-yotpo-section-id="${window?.yotpoSectionId}"></div>
      </a>
    `
  }

  async #buildWishListIcon(product, variantTitle) {
    return `
      <div class="gpc__wishlist">
        <div class="gpc__wishlist-wrapper flex justify-center align-center">
          <button
          aria-label="Add ${variantTitle} to wishlist" data-with-epi="true"
          class="swym-button swym-add-to-wishlist-view-product product_${product.id_product}"
          data-swaction="addToWishlist"
          data-product-id="${product.id_product}"
          data-variant-id="${product.id}"
          data-product-url="${window.shopUrl}/${product.handle_product}"
          ></button>
        </div>
      </div>
    `;
  }

  async #getHtmlTemplate() {
    const { product } = this.settings;

    const variantImage = this.#createResponsiveImage({
      src: product.image_variant
        ? product.image_variant
        : product.image_product,
      alt: product.title,
      width: 512,
      classList: 'd-block',
    });

    const hoverImage = product.images_product.length > 1 ? this.#createResponsiveImage({
      src: product.images_product[2]
        ? product.images_product[2]
        : product.images_product[1],
      alt: `${product.title} hover`,
      width: 512,
      classList: 'd-block hover-img',
    }) : '';

    const variantAddToBagButton = this.#buildVariantAddToBagButton(product)
    const quickViewButton = this.#buildQuickViewButton(product)

    const variantTitle =
      product.title_variant && !product.title_variant.includes('Default')
        ? product.title_variant
        : product.title_product;

    const variantParagraph = product.tagline_variant
      ? product.tagline_variant
      : product.subheading_product;

    const variantBadge = product.routine
      ? `<span class="gpc__badge t-xxs lh-16 block-z3">${product.routine}</span>`
      : '';

    return `
      <div class="flex flex-grid--d3 column-nowrap justify-space block-rel block-fh">
        <span class="gpc__img-wrapper">
          <a href="/products/${product.handle_product}?variant=${product.id}" class="block-rel">
            ${variantBadge}

            ${await this.#buildLabel(product, variantTitle)}

            ${variantImage}
            ${hoverImage}
          </a>

          <div class="gpc__button-bar ${this.settings.type === 'redemption' ? 'gpc__button-bar--redemption' : ''} justify-space block-12/12">
            ${this.settings.type === 'redemption' ? `
                <span style="width:100%" data-lion-seamless-product-reward='${product.id_product}' data-variant-id='${product.id}'>
                </span>
              ` : 
              `
                ${variantAddToBagButton}
                ${quickViewButton}
              `}
          </div>

          ${this.settings.type === 'redemption' ? '' : `
            <button class="gpc__atb-btn btn-reset" aria-label="Add To Bag"></button>
          `}
        </span>

        <a class="variant-title-container" href="/products/${product.handle_product}?variant=${product.id}">
          <span class="variant-title ls-2 t-rm lh-20">
            ${variantTitle}
          </span>
        </a>

        <a href="/products/${product.handle_product}?variant=${product.id}"
            class="flex flex-grid--d3 column-nowrap grow-1 justify-space t-xxs lh-18">
          ${variantParagraph}
          ${this.buildReviews(product)}
        </a>
        
        <div class="flex flex-grid--d3 column-nowrap">
          <span class="ls-1_5 t-xxs f-w400 lh-18">
            ${this.settings.type === 'redemption' ? `` : await this.#buildPrice(product)}
          </span>
        </div>

        ${await this.#buildWishListIcon(product, variantTitle)}
      </div>
    `;
  }
}


if (!customElements.get('global-product-card')) {
  customElements.define('global-product-card', GlobalProductCard)
}


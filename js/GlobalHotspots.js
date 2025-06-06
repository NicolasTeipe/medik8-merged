// deps [parseHTML,ObserverLite,DomReadyPromise] loaded globally

async function getProduct(handle){
  const api = await new StoreFrontApi()
  let query = `
    {
      productByHandle(handle:"${handle}"){
        id
        title
        metafields(
          identifiers: [
            { namespace: "sf_product_hero", key: "sub_heading" },
            { namespace: "sf_product_hero", key: "size" }
          ]
        ) {
          key
          namespace
          value
        }
        options(first:3){
          name
          optionValues{
            id
            name
          }
        }
        variants(first:25){
          edges{
            node{
              id
              sku
              availableForSale
              title
              price{
                amount
              }
              compareAtPrice{
                amount
              }
              image{
                altText
                url
              }
              selectedOptions{
                name
                value
              }
              metafields(
                identifiers: [
                  { namespace: "MOS2", key: "tagline" },
                  { namespace: "custom", key: "badge" }
                ]
              ) {
                key
                namespace
                value
              }  
            }
          }
        }
      }
    }
  `

  let product = null
  try{
    const { data , errors } = await api.authFetch({
      body:query
    })
    if(errors){
      return {errors}
    }
    product = data.productByHandle
    if(!product){
      return false
    }
    product.variants = product.variants.edges.map( 
      ({node}) => node 
    ).map(item => {
      item.id = item.id.split('/').reverse()[0]
      return item
    })
    return product || false
  }catch(err){
    console.error(err)
    return false
  }
}

export class GlobalHotspotTarget extends HTMLElement{
  constructor() {
    super();
  }

  connectedCallback() {
    DomReadyPromise().then( async () => {
      const {
        product_handle,
        sku,
        hotspot_item_class,
        hotspot_item_target,
        dark,
        show_reviews,
      } = this.dataset;

      if(!product_handle){
        this.remove()
        return
      }

      this.style.opacity = '1'
      this.product_handle = product_handle
      this.sku = sku && sku.length ? sku : false
      this.hotspot_item_class = hotspot_item_class || false
      this.dark = dark === 'true' ? true : false
      this.showReviews = show_reviews === 'true' ? true : false

      this.addEventListener('click', async (e) => {
        if(this.dataset.open == "true"){
          return
        }
        e.preventDefault()
        e.stopPropagation()
        if(!this.hotspot){
          const target = 
            hotspot_item_target && this.closest(hotspot_item_target) ? 
            this.closest(hotspot_item_target) : 
            this.parentNode

          target.insertAdjacentHTML('beforeend',` 
              <global-hotspot-item
                ${this.hotspot_item_class ? (`class="${this.hotspot_item_class}"` ) : ''}
                data-product_handle="${this.product_handle}"
                data-sku="${this.sku}"
                data-dark="${this.dark}"
                data-show_reviews="${this.showReviews}">
              </global-hotspot-item>
            `
          )

          this.hotspot = target.querySelector(`global-hotspot-item[data-product_handle="${this.product_handle}"]`)
          const {error,ready} = await this.hotspot.ObserverLite.once()
          if(error){
            this.remove()
            return
          }

          this.hotspot.subscribe(({open,error}) => {
            if(error){
              this.remove()
              return
            }
            this.dataset.open = open
          })
        }

        this.hotspot.show()
      })
    }).catch(err => {
      console.error(err)
    })
  }

}

customElements.define('global-hotspot-target', GlobalHotspotTarget);


export class GlobalHotspotItem extends HTMLElement{
  constructor() {
    super();
    this.onBodyClick = this.onBodyClick.bind(this)
  }

  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(data){
    this.ObserverLite.next(data)
  }

  connectedCallback() {
    this.ObserverLite = new ObserverLite()
    this.GlobalHotspotObserver = new ObserverLite({ key: 'Global.HotspotEvents' });

    DomReadyPromise().then( async () => {
      const { product_handle , sku, dark, show_reviews } = this.dataset
      if(!product_handle){
        this.hide()
        this.next({error:'no product found'})
        this.remove()
        return
      }
      this.always_visible = this.attributes.always_visible ? true : false
      this.product_handle = product_handle
      this.sku = sku && sku.length ? sku : false
      this.dark = dark === 'true' ? true : false
      this.showReviews = show_reviews === 'true' ? true : false

      if(!this.always_visible){
        this.allHotspots$ = new ObserverLite({key:'Global.AllHotspots$'})
        this.allHotspots$.subscribe((element) => {
          if(element != this){
            this.hide()
          }
        })
      }else{
        this.show()
      }


      this.next({ready:true})
    }).catch(err => {
      console.error(err)
    })
  }
  
  animateIn(){
    this.style.display = 'block'
    this.animate([{
      opacity: 0,
    }, {
      opacity: 1,
    }], 300)
    .onfinish = (e) => {
      this.style.opacity = 1
    }
  }

  animateOut(){
    this.animate([{
      opacity: 1,
    }, {
      opacity: 0,
    }], 300)
    .onfinish = (e) => {
      this.style.display = 'none'
      this.style.opacity = 0
    }
  }

  onBodyClick(e) {
    if (!this.contains(e.target)) {
      this.hide()
    }
  }

  async show(){
    this.animateIn()

    if(!this.rendered){
      await this.render()
    }
    if(!this.always_visible){
      document.body.addEventListener('click',this.onBodyClick)

      let isMouseDown = false;
      let startX = 0;
      let startY = 0;
      const threshold = 100;
      const _this = this

      document.addEventListener("mousedown", (event) => {
        isMouseDown = true;
        startX = event.clientX;
        startY = event.clientY;
      });

      document.addEventListener("mouseup", (event) => {
        if (isMouseDown) {
          const deltaX = Math.abs(event.clientX - startX);
          const deltaY = Math.abs(event.clientY - startY);

          if (deltaX > threshold || deltaY > threshold) {
            _this.hide()
          }

          isMouseDown = false;
        }
      });
    }
    if(this.allHotspots$){
      this.allHotspots$.next(this)
    }

    this.GlobalHotspotObserver.next({ event: 'show', hotspot: this }); // ? this...?

    this.next({open:true})
  }

  async hide(){
    this.animateOut()
    if(!this.always_visible){
      document.body.removeEventListener('click',this.onBodyClick)
    }
    this.next({open:false})
  }

  async render(){
    if(!this.productData){
      this.dataset.loading = true
      const product = await getProduct(this.product_handle)
      if(!product){
        this.hide()
        this.next({error:'no product found'})
        this.remove()
        return
      }
      this.productData = product
      this.GlobalCart = await new GlobalCart()
    }

    let yotpoReviews = this.showReviews
      ? this.buildReviews(this.productData, this.product_handle)
      : null;

    let variantIndex = !this.sku ? 0 : this.productData.variants.findIndex(({sku}) => sku == this.sku )
    variantIndex = variantIndex >= 0 ? variantIndex : 0
    this.variant = this.productData.variants[variantIndex]

    const subheading =
      this.variant.metafields
        ?.filter(item => item !== null)
        .find(({ key, value }) => value && key == 'tagline')?.value ||
      this.productData.metafields
        ?.filter(item => item !== null)
        .find(({ key, value }) => value && key == 'sub_heading')?.value ||
      false;

    const size = 
      this.productData.metafields?.filter(item => item !== null).find(({key,value}) => value && key == 'size')?.value?.split('/')[variantIndex] ||
      false

    const productUrl = `/products/${this.product_handle}?variant=${this.variant.id}`

    const price = await this.#buildPrice(
      this.variant.price.amount,
      this.variant.compareAtPrice?.amount,
      this.variant.id
    );

    const badgeText = 
      this.variant.metafields?.filter(item => item !== null).find(({key,value}) => value && key == 'badge')?.value?.split('/')[variantIndex] || false

    this.innerHTML = `
      <div class="flex row-wrap align-stretch justify-left ${this.dark ? 'bdr' : ''}">
        <a href="${productUrl}" class="flex img-wrapper">
          ${badgeText ? `
            <span class='badge-v2 badge-v2__product-card block-z3' aria-label='${badgeText}'>${badgeText}</span>
          ` : ""}
          <img 
          class="global-hotspot-item__img"
          width="256"
          height="256"
          alt="${this.productData.title} - ${this.variant.title}"
          src="${this.variant.image.url}?w=256">
        </a>
        <div class="global-hotspot-item__content flex column-nowrap gap--d3 ${this.dark ? 'invert' : ''}">
          <a href="${productUrl}" class="h-style t-rm f-w500">${this.variant.title === 'Default Title' ? this.productData.title : this.variant.title}</a>
          ${subheading ?
            (`<span class="global-hotspot-item__subheading">${subheading}</span>`) : ''}
          ${yotpoReviews ? yotpoReviews : '<div data-reviews="false"></div>'}

          <div class="v2-size-price-block t-xxs lh-m">
            ${size ? `<span>${size.trim()}</span>` : ''}
            <span>${price}</span>
          </div>
          <button class="global-hotspot-item__atc v2-atc-bag-btn btn-reset" aria-label="Add To Bag"></button>
        </div>
      </div>
    `
    // Applied on user click, extra checks are unnecessary.
    if(window.yotpoWidgetsContainer !== undefined) {
      await window.yotpoWidgetsContainer.initWidgets()
    }

    this.button = this.querySelector('button')
    this.toggleAtcButtonState()

    this.GlobalCart.subscribe(() => {
      this.toggleAtcButtonState()
    })

    this.button.addEventListener('click',(e) => {
      this.button.disabled = true
      this.dataset.loading = true
      const data = {
        items:[
          {
            id:this.variant.id,
            quantity:1,
          }
        ]
      }
      this.GlobalCart.addToCart(data).then( () => {
        this.dataset.loading = false
      })
    })
    this.rendered = true
    this.dataset.loading = false
  }

  toggleAtcButtonState(){
    const qty = this.GlobalCart.getLineItemsByVariantId(
      this.variant.id
    ).map(
      ({quantity}) => quantity
    ).reduce(
      (total, qty) => total + qty
      , 0
    )
    this.button.disabled = qty >= 6
  }

  async #buildPrice(price, compareAtPrice, variantId) {
    compareAtPrice = compareAtPrice * 100 || undefined
    price = price * 100

    const priceFontWeight = compareAtPrice ? ' f-w600' : ''
    const priceActual = `<span class='price-v2__${
      variantId
    }${priceFontWeight}'>${this.GlobalCart.ShopifyUtils.formatMoney(price)}</span>`;

    let priceHtmlStr = compareAtPrice
      ? `<s class="cell-r--d3">${this.GlobalCart.ShopifyUtils.formatMoney(
          compareAtPrice
        )}</s>${priceActual}`
      : priceActual;

    if (sitewide) {
      priceHtmlStr = await sitewide.updateGlobalProductPriceV2(
        variantId,
        priceHtmlStr
      );
    }

    return priceHtmlStr;
  }

  buildReviews(product, handle) {
    return `
      <a href="/products/${handle}#shopify-section-product-reviews-js" class="hotspot-reviews">
        <div class="yotpo-widget-instance no-events" data-yotpo-instance-id="${window?.yotpoStarsInstanceId}" data-yotpo-product-id="${product.id.split('/Product/')[1]}" data-yotpo-cart-product-id="" data-yotpo-section-id="${window?.yotpoSectionId}"></div>
      </a>
    `
  }
}

customElements.define('global-hotspot-item', GlobalHotspotItem);

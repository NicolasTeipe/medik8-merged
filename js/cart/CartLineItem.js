// deps [parseHTML,ObserverLite,DomReadyPromise] loaded globally

export class CartLineItem extends HTMLElement{
  constructor(params) {
    super();
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
          this.GlobalCart = await new GlobalCart()
          this.render()
        }
      }
    }).catch(err => {
      console.log(err)
    })
  }

  async bind(){ 
    this.GlobalCart = this.GlobalCart || await new GlobalCart()
    this.qtyselector = this.querySelector('.js-sidebar-cart__update')
    this.qtyselector?.addEventListener('change',(e) => {
      this.GlobalCart.updateQty(this.settings.line_item,parseInt(this.qtyselector.value))
    })
    this.qtyselector?.addEventListener('click',(e) => {
      e.preventDefault()
      e.stopPropagation()
    })

    this.removeButton = this.querySelector('.js-sidebar-cart__remove')
    this.removeButton?.addEventListener('click',(e) => {
      e.preventDefault()
      e.stopPropagation()
      this.GlobalCart.updateQty(this.settings.line_item,0)
      this.remove()
    })

    this.sellingPlanSelector = this.querySelector('selling-plan-selector')
    if(this.sellingPlanSelector){
      this.sellingPlanSelector.subscribe( () => {
        const {key,quantity} = this.settings.line_item
        const selling_plan = parseInt(this.sellingPlanSelector.selected)
        const data = {
          key,
          quantity,
          selling_plan
        }

        this.GlobalCart.updateLine(data)
      })
    }
  }

  getPreTitlesHtml({params,properties,product_type, badge}){
    let preTitle =  `
      ${ params.is_sample ? (
        `
          <span class="sb-cart-item__pre-title">${this.settings.translations.product.free_sample}</span>
        `
      ) : ''}
      ${ params.isFreeGift || params.isFreeTravelSize ? (
        `
          <span class="sb-cart-item__pre-title">${this.settings.translations.product.free_gift}</span>
        `
      ) : ''}
      ${ params.isBirthdayGift ? (
        `
          <span class="sb-cart-item__pre-title">${this.settings.translations.product.birthday_gift}</span>
        `
      ) : ''}  
      ${ properties._bundle || product_type === 'Bundles' ? (
        `
          <span class="sb-cart-item__pre-title">${this.settings.translations.product.bundle}</span>
        `
      ) : ''}
    `.trim().replace(/\n\s+/g, '');

    if (!preTitle.length && badge)
      preTitle = `<span class="sb-cart-item__badge" aria-label="${badge}">${badge}</span>`

    return preTitle
  }

  render(){ 
    let {
      line,
      product_title,
      variant_title,
      image,
      url,
      discounts,
      key,
      quantity,
      final_line_price,
      original_line_price,
      properties,
      product_type,
      selling_plan_group,
      selling_plan_allocation,
      badge
    } = this.settings.line_item

    properties = properties || {}
    let qtyLimit = properties._variantInventoryQty ? properties._variantInventoryQty : 6
    qtyLimit = qtyLimit > 6 ? 6 : qtyLimit

    const params = {}
    params.isBirthdayGift = properties._birthdayGift && final_line_price == 0 
    params.isFreeGift = properties._FreeGiftTieredDiscountId && final_line_price == 0 || properties._gift || params.isBirthdayGift
    params.is_sample = properties._RoswellSample || 
                      product_type?.toLowerCase().includes('sample') || 
                      product_title?.toLowerCase().includes('sample') || 
                      variant_title?.toLowerCase().includes('sample')
    params.isFreeTravelSize = final_line_price == 0 && product_title?.toLowerCase().includes('travel size') && !params.isFreeGift
  
    const showDiscounts = params.isFreeGift || params.is_sample || properties._birthdayGift || properties._bundle || properties._csa_builder
    const disableLink = false
    const showQtySelector = showDiscounts || disableLink || qtyLimit <= 0 || params.isFreeTravelSize ? false : true 
    const showRemove = !params.isFreeGift ? true : false
    const subscriptions = this.settings.subscriptions
    const showSellingPlanSelector = !params.isFreeGift && !params.is_sample && (selling_plan_group || selling_plan_allocation) && subscriptions.show && subscriptions.button_text.length

    if(showSellingPlanSelector && selling_plan_allocation){
      original_line_price = selling_plan_allocation.compare_at_price * quantity
      final_line_price = selling_plan_allocation.price * quantity
    }

    if( (params.isFreeGift || params.is_sample) && !discounts.length){
      discounts.push({
        title: "Free Product"
      })
    }

    const imageHTML = `
      <img 
        src="${image}?&width=128" 
        alt="${product_title}" 
        loading="lazy" 
        width="128" 
        height="128"
      >
        ${ !showQtySelector ? 
          `<span class="counter global-cart-line-pill">${quantity}</span>` : 
          '' 
        }
    `

    const titleHTML = `
      ${this.getPreTitlesHtml({params,properties,product_type, badge})}

      <span class="d-block f-w600 t-s ls-5 lh-18 t-ucase t-black">${
        variant_title ? variant_title : product_title
      }</span>

      ${ properties._csa_builder ? (
        `<span class="sb-cart-item__sub-title t-black">CSA Kit Builder: ${properties._csa_builder}</span>`
      ) : ''}
    `

    const thumbMain = 
      `
        ${ disableLink ? 
          `<div class="sb-cart-item__image">${imageHTML}</div>` :
          `<a aria-label="View ${product_title}" href="${url}" class="sb-cart-item__image">${imageHTML}</a>`
        }
    
        <div class="sb-cart-item__details cell-l block flex column-wrap align-top justify-left flex-grid-y--d3">
          
          ${ disableLink ? 
            `<div class="block flex column-wrap align-top justify-left flex-grid-y--d3">${titleHTML}</div>` :
            `<a aria-label="View ${product_title}" href="${url}" class="block flex column-wrap align-top justify-left flex-grid-y--d3">${titleHTML}</a>`
          }

          ${
            showQtySelector || showRemove ? ( 
              `
                <div class="flex row-wrap align-center flex-grid--d2">
                  ${ showQtySelector ? (
                    `
                      <select 
                        class="js-sidebar-cart__update select-alt-style select-alt-style--s" 
                        name="qty" data-id="${key}" aria-label="quantity">
                        ${new Array(qtyLimit + 1).fill(false).map( (item,index) => {
                          return `<option value="${index}" ${index == quantity ? 'selected' : ''}>${index}</option>`
                        }).join('')}
                      </select>
                    `
                  ) : ''}

                  ${ showRemove ? (
                    `
                      <button type="button" class="js-sidebar-cart__remove t-s t-black" data-id="${key}">
                        <u>${this.settings.translations.product.remove}</u>
                      </button>
                    `
                  ) : '' }
                </div>
              `
            ) : ''
          }

          ${
            params.isBirthdayGift ? ( 
              `
                <button type="button" class="js-sidebar-cart__remove t-s" data-id="${key}">
                  <u>${this.settings.translations.product.remove}</u>
                </button>
              `
            ) : ''
          }

          ${final_line_price ? (
            `
              <span class="sb-cart-item__price f-w600 t-s ls-5 lh-18 flex column-nowrap align-bottom">
                ${ original_line_price != final_line_price ? `
                  <small class="t-s t-grey"><s>${this.GlobalCart.ShopifyUtils.formatMoney(original_line_price)}</s></small>
                `   : '' }
                <span>${this.GlobalCart.ShopifyUtils.formatMoney(final_line_price)}</span>
              </span>
            `
          ) : ''}

          ${showDiscounts && discounts && discounts.length && 1 == 3 ? (
            `
              ${discounts.map( ({title}) => {
                return `<span class="sb-cart-item__discount d-block tar"><i class="wayfx-icon wayfx-icon-tag"></i>${title}</span>`
              }).join('')}
            `
          ) : '' }  
      </div>
    `

    this.innerHTML = `
      <div class="sb-cart-item block-rel flex row-wrap align-top justify-left">
        ${thumbMain}
      </div>
      ${ 
        showSellingPlanSelector ? (
          `
           <selling-plan-selector class="block-12/12">
             <template>
               {
                 "selling_plan_group":${ selling_plan_group ? JSON.stringify(selling_plan_group) : 'false' },
                 "selling_plan_allocation":${ selling_plan_allocation ? JSON.stringify(selling_plan_allocation) : 'false'},
                 "translations":{
                    "button_text":"${subscriptions.button_text}"
                 }
               }
             </template>
           </selling-plan-selector>
          `
        ) : ''

      }
    `
    this.bind()
  }
}
customElements.define('cart-line-item', CartLineItem);

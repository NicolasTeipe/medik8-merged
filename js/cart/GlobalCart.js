import { ObserverLite } from '../ObserverLite.js';
import { ShopifyUtils } from '../ShopifyUtils.js';
export class GlobalCart {

  constructor(settings){
    const singleton$ = new ObserverLite({key:'GlobalCart$'})

    if(!settings){
      return new Promise( async (resolve,reject) => {
        const instance = await singleton$.once()
        resolve(instance)
      })
    }else{
      this.ObserverLite = new ObserverLite()
      this.requestQueues$ = new ObserverLite({key:'GlobalCart.requestQueues$'})
      this.ShopifyUtils = new ShopifyUtils({ 
        money_format:settings.money_format || false,
      }) 
      this.currency_symbol = settings.currency_symbol
      this.market = settings.market.replace(/\/?$/, '/')
      this.updateCartData(settings.cart) 
      this.section_ids = ['global__cart_json']
      this.addFetchMnkPatch()
      singleton$.next(this)
    }

    // Listen for the octane AI custom event to update cart
    // help.octaneai.com/en/articles/8038287-the-add-to-cart-button-doesn-t-update-the-shopping-cart-icon
    document.addEventListener('octane.quiz.addToCart', (e) => {
      this.forceUpdateCart()
    })

    // Listener for adding products via LoyaltyLion redemption
    document.addEventListener('loyalty.redemption', (e) => {
      this.forceUpdateCart()
    })

    document.addEventListener('update-drawer-cart', (e) => {
      this.forceUpdateCart();
      if (e.detail.openDrawer) {
        const cartBtn = document.querySelector('.js-cart-toggle.jsonly');
        if (cartBtn != null) {
          cartBtn.click();
        }
      }
    });
  }

  /*
    We cannot fetch the /cart with a regular GET request and retrieve bundled sections directly. To ensure we get the cart data with a compliant format and use the current logic, we use a POST request to /cart/update.js. This request updates the cart without changing any quantities, acting as a workaround to fetch the cart as a bundled section render.
  */
  forceUpdateCart() {
    const sectionIds = this.section_ids.join(',')
    const data = {
        updates: {}, // Empty updates to avoid modifying the cart
        sections: sectionIds
    }
    fetch('/cart/update.js', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        globalCart: true
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update cart data')
        }
        return response.json()
    })
    .then(updatedCartData => {
        if (updatedCartData.sections) {
            this.last_item = updatedCartData
            this.cartResponseHandler(updatedCartData)
        } else {
            throw new Error('No sections in cart response')
        }
    })
    .catch(error => {
        console.error("Error updating cart:", error)
    })
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }

  serialize(form) {
    const obj = {};
  
    function setValue(obj, keys, value) {
      const lastKey = keys.pop();
      let currentObj = obj;
      for (const key of keys) {
        if (!currentObj[key]) {
          currentObj[key] = {};
        }
        currentObj = currentObj[key];
      }
      currentObj[lastKey] = value;
    }
  
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
      const keys = key.split('[').map(k => k.replace(']', ''));
      setValue(obj, keys, value);
    }
  
    return obj;
  }

  updateCartData(data){
    data.selling_plan_groups = 
      !data.selling_plan_groups ? 
      false : 
      data.selling_plan_groups.filter(({selling_plan_group}) => selling_plan_group).map( group => {
      // assume there is only one % discount ... todo, what if there are multiple price_adjustments?
      const percentage = group.selling_plan_group?.selling_plans?.map( 
        ({price_adjustments}) => price_adjustments.filter( ({value_type}) => value_type == 'percentage').map( ({value}) => value)
      )
      .flat(1)
      .sort((a,b) => a - b) || false
      group.selling_plan_group.discount_percentage = percentage ? percentage[0] : false
      return group
    })

    this.cart = data.cart
    this.cart.items.forEach( (item,index) => {
      item.line = index + 1
      if(!item.selling_plan_group){
        const sellingPlanGroupForVariant = data.selling_plan_groups.find(({variant_id}) => variant_id == item.variant_id)
        item.selling_plan_group = sellingPlanGroupForVariant?.selling_plan_group || false
      }
    })

    // upd cart object with badge data
    const badgeMap = new Map(
      data.badges?.map(badge => [badge.variant_id, badge.badge])
    );
    this.cart.items.forEach(item => {
      item.badge = badgeMap.get(item.variant_id) || null;
    });

    const itemsWithZeroBugCatch = this.cart.items.filter( ({quantity}) => !quantity)
    this.cart.items = this.cart.items.filter( ({quantity}) => quantity)
    this.cart.itemsWithZeroBugCatch =  itemsWithZeroBugCatch.length ? itemsWithZeroBugCatch : false
  }

  cartResponseHandler(data,discrete){
    if (!data.sections || !data.sections.global__cart_json) {
      return;
    }

    this.sections = data.sections
    try{
      let template = parseHTML(this.sections.global__cart_json).querySelector('template').innerHTML
      this.updateCartData(JSON.parse(template))
    }catch(err){
      const error = new Error('error parsing cart data')
      error.data = err
      throw error
    }
    if(data.queue){
      return
    }
    this.next({
      eventType: 'update',
      discrete: discrete,
      data:{
        itemsWithZeroBugCatch: this.cart.itemsWithZeroBugCatch
      }
    }) 
  }

  addToCart(data,discrete) {
    return new Promise((resolve, reject) => {
      if(!data){
        reject({
          description: "Sorry, there was a problem with that request"
        })
      }
      // reject with error if user tries to add more than 6. This would need to be updated to handle / show multiple error messages
      const itemsWithMoreThanMax = data.items.filter( ({id}) => {
        const inCart = this.getLineItemsByVariantId(id).map( ({quantity}) => quantity ).reduce((accumulator, currentValue) => {
          return accumulator + currentValue
        },0)
        return inCart >= 6 
      })
      if(itemsWithMoreThanMax.length){
        reject({
          type:'max_six',
        })
      }
      data.sections = this.section_ids 
      fetch(`${this.market}cart/add.js`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        globalCart:true
      }).then( async (response) => {
        if(response.status == 200){
          return response.json()
        }else{
          const data  = await response.json()
          const error = new Error(data.description)
          error.data = data
          throw error
        }
      }).then((data) => {
        if(data){
          this.last_item = data
          this.cartResponseHandler(data,discrete)
          resolve()
        }else{
          throw new Error('no data in cart response')
        }
      }).catch(err => {
        reject(err)
      })
    })
  } 

  updateQty(line_item,quantity,updateData,discrete) {
    return new Promise((resolve,reject) => {
      updateData = updateData || [
        {
          key:line_item.key,
          quantity:quantity
        }
      ]
  
      // remove items that are in a bundle
      if(line_item?.properties?._bundle_id){
        updateData = updateData.concat(this.cart.items.filter(({properties}) => properties?._bundle_id == line_item.properties._bundle_id).map( ({key}) => {
          return {
            key:key,
            quantity:0
          }
        }))
      }

      const updates = updateData.reduce((obj, item) => ({ ...obj, [item.key]: item.quantity }), {})
      fetch('/cart/update.js',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body:JSON.stringify(
          {
            updates: updates,
            sections: this.section_ids 
          }
        ),
        globalCart:true
      })
      .then( async (response) => {
        if(response.status == 200){
          return response.json()
        }else{
          const data  = await response.json()
          const error = new Error(data.description)
          error.data = data
          throw error
        }
      })
      .then(data => {
        if(data){
          if(window.lion) {
            window.lion.setCartState(data)
          }
          this.cartResponseHandler(data,discrete)
          resolve()
        }else{
          throw new Error('no data in cart response')
        }
      }).catch(err => {
        reject(err)
        this.next({
          eventType: 'error',
          error:err,
          discrete: discrete
        }) 
      })
    })
  }

  updateLine(data,discrete) {
    return new Promise((resolve,reject) => {
      /* if key is supplied, swap for a line. This is because certain requests only accept line as an input, but line can change
         e.g when request is discrete, a UI item referencing line item will have incorrect value for line, since line is an index0,
         so it will have shifted based on items being added or removed
      */ 
      if(data.key){
        const lineItem = this.getLineItemsByKey(data.key)
        if(!lineItem){
          reject({err:'no line item matching key'})
          return
        }
        data.line = lineItem.line
        delete data.key
      }
      data.sections = this.section_ids 
      fetch('/cart/change.js',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body:JSON.stringify(data),
        globalCart:true
      })
      .then( async (response) => {
        if(response.status == 200){
          return response.json()
        }else{
          const data  = await response.json()
          const error = new Error(data.description)
          error.data = data
          throw error
        }
      })
      .then(data => {
        if(data){
          this.cartResponseHandler(data,discrete)
          resolve()
        }else{
          throw new Error('no data in cart response')
        }
      }).catch(err => {
        reject(err)
        this.next({
          eventType: 'error',
          error:err,
          discrete: discrete
        }) 
      })
    })
  }



  /**
   * Removes line items from the cart by setting their quantities to 0 and updates the cart state.
   * 
   * @param {Array<string>} keys - An array of keys representing line items to be removed.
   * @param {boolean} discrete - A flag to indicate whether the removal is part of a discrete action.
   * @returns {Promise<void>} Resolves when line items are successfully removed, or rejects with an error.
   */
  removeLineItemsByKey(keys, discrete) {
    const data = keys.reduce((obj, item) => {
      obj[item] = 0;
      return obj;
    }, {});

    return new Promise((resolve,reject) => {
      fetch('/cart/update.js',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body:JSON.stringify(
          {
            updates: data,
            sections: this.section_ids 
          }
        ),
        globalCart:true
      })
      .then( async (response) => {
        if(response.status == 200){
          return response.json()
        }else{
          const data  = await response.json()
          const error = new Error(data.description)
          error.data = data
          throw error
        }
      })
      .then(data => {
        if(data){
          this.cartResponseHandler(data,discrete)
          resolve()
        }else{
          throw new Error('no data in cart response')
        }
      }).catch(err => {
        reject(err)
        this.next({
          eventType: 'error',
          error:err,
          discrete: discrete
        }) 
      })
    })
  }

  getLineItemsByVariantId(id){
    id = parseInt(id)
    return !this.cart || !this.cart.items ? [] : this.cart.items.filter( ({variant_id}) => variant_id == id )
  }

  getLineItemsByKey(keyInput){
    return !this.cart || !this.cart.items ? false : this.cart.items.find( ({key}) => key == keyInput )
  }

  getLineItemsByProperty(key,value){
    return !this.cart || !this.cart.items ? [] : this.cart.items.filter( (item) => {
      let match = item.properties?.[key]
      match = value == null && match || match && match == value ? true : false
      return match
    })
  }

  getAllDiscountCodes() {
    return new Promise( async (resolve,reject) => {
      const cart = await this.cart
      // get from cart (only returns codes if items are in cart)
      let code
      // if cart has items, we can take the cart.discount_applications as truth
      if(cart?.items.length){
        code = [...
          new Set(
            cart.items.filter(
              ({discounts}) => discounts?.length
            ).map(
              ({discounts}) => discounts.map(({title}) => title)
            ).flat()
          )
        ]
        code = code.length ? code[0] : false
        localStorage.setItem('discountCode',code)
        resolve(code)
      }else{
        // use cookie - when user visits /discounts/CODE then this cookie is added, but it doesnt persist
        code = Object.fromEntries(new URLSearchParams(document.cookie.replace(/; /g, "&")))?.discount_code || false
        if(code){
          localStorage.setItem('discountCode',code)
        }else{
          code = localStorage.getItem('discountCode')
        }
        resolve(code)
      }
    })
  }

  // get instances of a free  tiered discount in the cart
  async get_CartFreeDiscountV2Gifts(){
    const {items} = await this.cart
    return items?.filter(
      ({properties}) => properties?._FreeGiftTieredDiscountId
    ) || false     
  }
      // get total of cart Exc. free gifts
  async get_CartTotalMinusFreeGifts(includeDiscount){
    // get cart total - free gifts
    const cart = await this.cart
    let cartTotal = includeDiscount ? cart.total_price : cart.original_total_price
    const cartItemsWithTieredDiscountGift = await this.get_CartFreeDiscountV2Gifts()
    const freeGiftItemsTotal = cartItemsWithTieredDiscountGift?.map(({original_price}) => original_price).reduce((a, b) => a + b, 0) || 0
    cartTotal = cartTotal - freeGiftItemsTotal
    return cartTotal
  }


  requestQueueHandler(queues){
    const size = Object.values(queues).reduce((a, b) => a + b, 0)
    this.requestQueues$.next(size)
  }
  
  // subscribes to all cart related fetch events, puts them into a queue to avoid overwrite weirdness and passes response / data to our consumer, which then updates the observer 
  addFetchMnkPatch(){
    const originalFetch = window.fetch;
    const urlsToCatch = [`${this.market}cart/add.js`, '/cart/update.js', '/cart/change.js']
    const requestQueues = {}

    let fetchChain = Promise.resolve();
    window.fetch = async (...args) => {
      if (args[0] instanceof Request) {
        return originalFetch(args[0]);
      }
      const [url,settings] = args    
      let blockSubscriber = false
      let check = false
      try{
        if (typeof url === 'string') {
          check = urlsToCatch.some(path => {
            try {
              return url.includes(path)
            } catch (innerErr) {
              return false
            }
          });
        }
      }catch(err){
        return originalFetch(...args)
      }
      if (check) {
        if(!settings?.globalCart){
          // add the section we use to fetch JSON data to the request
          try{
            const contentType = settings.headers?.['Content-Type'];
            if (contentType === 'application/json') {
              const body = JSON.parse(settings.body)
              body.sections = [...body.sections ? body.sections : [],...this.section_ids]
              settings.body = JSON.stringify(body)
            } else if (contentType?.startsWith('application/x-www-form-urlencoded')) {
              const body = new URLSearchParams(settings.body);
              body.set('sections', this.section_ids.join(',')); // Add the sections
              settings.body = body.toString(); // Re-encode the updated body
            } else {
              console.warn('Unhandled Content-Type:', settings.headers['Content-Type']);
            }
          }
          catch(err){
            console.error('Error processing settings.body:', err);
            blockSubscriber = true
          }
        }else{
          // create a queue, so we dont fire the update callbacks whilst requests pending
          requestQueues[url] = requestQueues[url] || 0
          requestQueues[url] = requestQueues[url] + 1
        }

        this.requestQueueHandler(requestQueues)
        const fetchPromise = new Promise((resolve, reject) => {
          fetchChain = fetchChain.finally(() => {
            return originalFetch(...args)
              .then( async (response) => {
                // clone the response so we can .json it
                const clonedResponse = response.clone()
                if(!blockSubscriber){
                  // update the queue
                  if(requestQueues[url]){
                    requestQueues[url] = requestQueues[url] - 1
                  }
                  let queue = requestQueues[url]
                  // get the data from the original response, add the queue param, then resolve the promises.
                  let data = await response.json()
                  data.queue = queue
                  const modifiedResponse = new Response(JSON.stringify(data), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                  })
          
                  resolve(modifiedResponse)
                  this.requestQueueHandler(requestQueues)
                  // if the promise wasn't subscribed inside globalCart e.g. request made from elsewhere, run the response handler
                  clonedResponse.json().then(data => {
                    data.queue = queue
                    if(!settings?.globalCart){
                      this.cartResponseHandler(data)
                    }
                  })
                }
              })
              .catch(error => {
                reject(error)
              });
          })
        })
        return fetchPromise
      } else {
        return originalFetch(...args)
      }
    }
  }
        

}
/* ADD / REMOVE FREE GIFTS FROM THE BASKET (DISCOUNT TIERS 2.0) 
      AppliedTierDiscount = 
      ** tiered discount that is currently applied to the cart
      ActiveProgressBarTierDiscount = 
       ** tiered discount that should show in progress bar
       ** could be AppliedTierDiscount, but doesn't have to be, e.g an autodiscount where threshold not yet met
  
*/

export class DiscountsV2Util{

  constructor(settings){
    this.singleton$ = new ObserverLite({key:'DiscountsV2Util$'})
    if(!settings){
      return new Promise( async (resolve,reject) => {
        const instance = await this.singleton$.once()
        resolve(instance)
      })
    }
    this.settings = settings
    this.singleton$.next(this)
  }

  async bindData(){
    this.GlobalCart = await new GlobalCart()
    const V2discountTiers$ = new ObserverLite({key:'V2discountTiers$'}) 
    this.DiscountTierMetafields = await V2discountTiers$.once() 
  }

  discountStatusCheck(status,startsAt,endsAt){
    const now = new Date()
    let show =
      (status == 'ACTIVE' && 
        ( 
          !endsAt || endsAt && new Date(endsAt) > now
        ) 
      ) ||
      (status == 'SCHEDULED' && 
        ( 
          (startsAt && now >= new Date(startsAt)) &&
          (endsAt && now < new Date(endsAt))
        ) 
      )
    return show
  }

  // Gets the current ACTIVE discount tier
  async get_ActiveTieredDiscount(){
    await this.bindData()
    const AppliedTierDiscount = await this.get_AppliedTierDiscount()
    // if there is a discount applied to the cart, return that
    if(AppliedTierDiscount?.showInAov){
      const {status,startsAt,endsAt} = AppliedTierDiscount
      if(this.discountStatusCheck(status,startsAt,endsAt)){
        return AppliedTierDiscount
      }
    }
    let DiscountTierMetafields = this.DiscountTierMetafields
     /*
      TODO, Solve issue with ACTIVE possibly being out-of-sync with discount
      1. discount metafield (stores a 1:1 of the discount so we can access in theme. is updated when user make changes via UI
      2. discount data can change outside of the UI e.g. changing via menu OR becoming in-active due to date
    */
    // remove any that are not active or aren't set to show in AOV bar
    DiscountTierMetafields = DiscountTierMetafields.filter( 
      ({status,startsAt,endsAt}) => {
        return this.discountStatusCheck(status,startsAt,endsAt)
      }
    ) || false

    // remove any items that are Code discounts, since they need to be applied in order to be visible
    // remove any that fail customer validation
    // sort by largest discount, as this will be applied if multiple instances
    const {customer} = this.settings
    DiscountTierMetafields = DiscountTierMetafields.filter(
      ({discountMethod,customerTags}) => {
        if(discountMethod != 'Automatic'){
          return false
        }

        if(customerTags?.length){
          const shopifyCustomerTags = customer?.tags.map( tag => tag.toLowerCase()) || false
          const metafieldCustomerTags = customerTags.map( tag => tag.toLowerCase())
          return shopifyCustomerTags && (
            shopifyCustomerTags.some(tag => metafieldCustomerTags.includes(tag))
          ) ? true : false
        }

        return true
      }
    ).sort((a,b) => {
      const largestTier__a = a.tiers.sort( (_a,_b) => parseFloat(_b.amount) - parseFloat(_a.amount))[0]
      const largestTier__b = b.tiers.sort( (_a,_b) => parseFloat(_b.amount) - parseFloat(_a.amount))[0]

      return parseFloat(largestTier__b.amount) - parseFloat(largestTier__a.amount)
    })

    return DiscountTierMetafields.length ? DiscountTierMetafields[0] : false
  }
   // Gets the current ACTIVE discount tier to show in AOV
  async get_ActiveProgressBarTierDiscount() {
    //showInAov
    let activeDiscount = await this.get_ActiveTieredDiscount()
    return activeDiscount.showInAov ? activeDiscount : false
  }

  // returns data for the discount that is currently being APPLIED to the cart
  async get_AppliedTierDiscount() {
    await this.bindData()
    let DiscountTierMetafields = this.DiscountTierMetafields
    let activeDiscountsInCart = await this.GlobalCart.getAllDiscountCodes()
    activeDiscountsInCart = activeDiscountsInCart ? activeDiscountsInCart.split(':')[0] : false
    return DiscountTierMetafields?.find( 
      ({discountTitle}) => discountTitle == activeDiscountsInCart 
    ) || false
  }


  updateSoldOutItems(items){
    items = items.map(({variant_id}) => variant_id )
    let soldOutItems = this.getSoldOutItems()
    items = [
      ...items,
      ...soldOutItems
    ]
    sessionStorage.setItem('td2SoldOutFreeGWP',JSON.stringify([...new Set(items)]))
  }

  getSoldOutItems(){
    let soldOutItems = sessionStorage.getItem('td2SoldOutFreeGWP')
    if(soldOutItems){
      try{
        soldOutItems = JSON.parse(soldOutItems)
      }catch(err){
        soldOutItems = []
      }
    }else{
      soldOutItems = []
    }
    return soldOutItems
  }

  // Adds / removes gift products from the cart 
  async updateCartFreeGifts(){
    await this.bindData()
    const activeDiscount = await this.get_ActiveTieredDiscount()
    const cartTotal = await this.GlobalCart.get_CartTotalMinusFreeGifts()
    const cartItemsWithTieredDiscountGift = this.GlobalCart.cart.items.filter(
      ({properties}) => properties?._FreeGiftTieredDiscountId
    )

    // create array of items to be added and error arrays
    let freeGiftsForCurrentState = []
    let itemsToAdd = []
    let itemsWithMoreThanSixInBagError = []
    let itemsToAddWithSoldOutError = []
    if(activeDiscount){  
      activeDiscount.tiers = activeDiscount.tiers.map( tier => {
        tier.threshold = parseFloat(tier.threshold)
        tier.thresholdWithMultiplier = parseFloat(tier.thresholdWithMultiplier)

        const modifiedTotal = tier.calcDiscountTotal
          ? this.GlobalCart.cart.total_price / (1 - Number(tier.amount) / 100)
          : cartTotal;
        tier.active = parseFloat((modifiedTotal/ 100).toFixed(2)) >= tier.thresholdWithMultiplier
        return tier
      })
      // get array of variant ids for free gifts the user should be recieving based on current active discount
      freeGiftsForCurrentState = activeDiscount.tiers.filter(
        ({active}) => active
      ).map( 
        tier => tier.selectionData?.freeGift?.products ? Object.values(tier.selectionData.freeGift.products) : []
      )
      .flat(2)
      .map(GID => parseInt(GID.split('/').reverse()[0]))
      itemsToAdd = freeGiftsForCurrentState
      // remove any that are already in the bag
      itemsToAdd = itemsToAdd.filter( variant_id => {
        return !cartItemsWithTieredDiscountGift.some(
          line_item => line_item.properties._FreeGiftTieredDiscountId == activeDiscount.discountTitle && line_item.variant_id == variant_id
        )
      })
      // remove any where item is out of stock or adding more  ===  >6 in bag
      const soldOutItems = this.getSoldOutItems()
      itemsToAdd = itemsToAdd.filter( variant_id => {
        const soldOut = soldOutItems.includes(variant_id)
        const itemsInCartCount = this.GlobalCart.getLineItemsByVariantId(variant_id)?.map( ({quantity}) => quantity ).reduce((a, b) => a + b, 0) || 0
        if(itemsInCartCount >= 6){
          itemsWithMoreThanSixInBagError.push(variant_id)
        }
        if(soldOut){
          itemsToAddWithSoldOutError.push(variant_id)
        }
        return !soldOut && itemsInCartCount < 6
      })
    }
    
    // create array of updates to remove/update current free gifts
    const itemsToUpdate = []
    // loop trhough current GWPs in cart
    cartItemsWithTieredDiscountGift.forEach( item => {
      const itemsInCartCount = this.GlobalCart.getLineItemsByVariantId(item.variant_id)?.map( ({quantity}) => quantity ).reduce((a, b) => a + b, 0) || 0
      // remove free gifts if no active discount or free gift is in the cart when discount not active OR total inc. GWP is > 6
      if(
          !activeDiscount || 
          this.GlobalCart.freeGiftToggle.show && this.GlobalCart.freeGiftToggle.remove || 
          freeGiftsForCurrentState.indexOf(item.variant_id) == -1 ||
          !this.GlobalCart.cart.total_price ||
          itemsInCartCount > 6
        ){
        itemsToUpdate.push({
          key:item.key,
          quantity:0
        })
        if(!itemsInCartCount > 6){
          itemsWithMoreThanSixInBagError.push(item.variant_id)
        }
      }else{
        // if there are more than 1 of the item in the cart, remove it
        if(item.quantity > 1){
          itemsToUpdate.push({
            key:item.key,
            quantity:1
          })
        }
      }
    })

    itemsToAdd = {
      items: this.GlobalCart.freeGiftToggle.show && this.GlobalCart.freeGiftToggle.remove ? [] : itemsToAdd.map( (id) => {
        return{
          id:id,
          quantity:1,
          properties:{
            _FreeGiftTieredDiscountId: activeDiscount.discountTitle
          }
        }
      })
    }

    // build an array of line item keys for expired free gifts, 
    const expiredFreeGifts = this.GlobalCart.cart.items.filter(
      lineItem =>
        lineItem.properties?._FreeGiftTieredDiscountId &&
        lineItem.properties?._FreeGiftTieredDiscountId !==
          activeDiscount.discountTitle
    ).map(lineItem => lineItem.key)

    if (expiredFreeGifts.length) await this.GlobalCart.removeLineItemsByKey(expiredFreeGifts)

    try{
      if(itemsToAdd.items.length && this.GlobalCart.cart.total_price){
        await this.GlobalCart.addToCart(itemsToAdd)
      }
      if(itemsToUpdate.length){
        this.GlobalCart.updateQty(null,null,itemsToUpdate)
      }
    }catch(err){
      /*
        To do - something with these items, e.g. a message or somethig to inform user?
        console.log(err)
        these would need to go outside of the catch, e.g. throw an error above somehwere
        console.log(1,itemsWithMoreThanSixInBagError)
        console.log(2,itemsToAddWithSoldOutError)
      */
    }
  }

}


export class GlobalFreeGiftToggle extends HTMLElement{
  constructor() {
    super();
  }

  connectedCallback(){
    // temp fix - use domready to wait for discounts when this is rendered on /cart page
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
        if(!this.settings){
          return
        }
      }
      
      if(this.mounted){
        return
      }

      this.GlobalCartInstance = await new GlobalCart() 
      this.DiscountsV2Util = await new DiscountsV2Util()
      this.mounted = true
      this.innerHTML = `
      <div class="flex row-wrap align-center justify-space">
        <label 
          class="block-rel"
          for="remove_gifts">
          <span>
            ${this.settings.gift_remove__text}
          </span>
          <span class="tooltip"><i class="fa fa-question-circle"></i>
            <span class="tooltiptext">
              ${this.settings.remove__tooltip }
            </span>
          </span>
        </label>
        <label class="option-checktoggle">
          <input 
            class="option-checktoggle__input" 
            name="removeGifts"
            type="checkbox" 
            ${!this.GlobalCartInstance.freeGiftToggle.remove ? 'checked' : ''}>
          <div class="option-checktoggle__control"></div>
        </label>
      </div>
    `
      this.checkbox = this.querySelector('[name="removeGifts"]')
      this.checkbox.addEventListener('change',() => {
        this.GlobalCartInstance.freeGiftToggle.remove = !this.checkbox.checked
        localStorage.setItem(this.GlobalCartInstance.freeGiftToggle.key,!this.checkbox.checked)
        this.DiscountsV2Util.updateCartFreeGifts()
      })

      this.GlobalCartInstance.subscribe( ({eventType}) => {
        this.toggleView()
      })
      this.toggleView()
    }).catch(err => {
      console.log(err)
    })
  }

  async toggleView(){
    const cartHasFreeGifts = this.GlobalCartInstance.cart.items.some(item => {
      return item.properties && '_FreeGiftTieredDiscountId' in item.properties
    })

    cartHasFreeGifts || this.GlobalCartInstance.freeGiftToggle.remove
      ? this.removeAttribute('hidden')
      : this.setAttribute('hidden', true);
  }
} 

customElements.define('global-freegift-toggle', GlobalFreeGiftToggle);

// deps { ObserverLite } loaded in core
// Provides a consumable data source for conditional products 

export class GlobalConditonalUpsellProducer{

  constructor(settings){

    this.singleton$ = new ObserverLite({key:'GlobalConditonalUpsellProducer$'})

    if(!settings){
      return new Promise( async (resolve,reject) => {
        const instance = await this.singleton$.once()
        resolve(instance)
      })
    }

    this.init(settings)
  }

  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(data){
    this.ObserverLite.next(data)
  }

  async init(settings){
    this.ObserverLite = new ObserverLite()
    this.GlobalCart = await new GlobalCart()
    this.customer = settings.customer
  
    this.offers = settings.offers
    .map( offer => {        
      offer.ObserverLite = new ObserverLite({key:`ConditionalUpsell.${offer.id}`})
      offer.upsells = offer.upsells || []
      // TEMP - TODO add this as an option in the metaobject to allow use with none-samples
      offer.removeOnInvalid = true
      const validation = {
        upsell:true,
        offer_id:offer.id,
        min_spend:offer.logic_minimum_spend,
        variant_ids:offer.logic_cart_content_variant_ids,
        variant_excluding_ids:offer.logic_cart_content_variants_excluding_ids,
        samples_use_global_max:offer.samples_use_global_max == true ? true : false,
        max_items:offer.max_items || false,
        logic_allow_reorder: offer.logic_allow_reorder,
        validation_error_message: offer.validation_error_message,
        key:offer.key,
        customer:{
          required: {
            tags:offer.logic_customer_tags,
            customer_order_history_variants:offer.logic_customer_order_history_variants,
            new_customer_only:offer.logic_new_customers_only,
            logic_allow_reorder: offer.logic_allow_reorder
          },
          current:this.customer ? {
            email:this.customer.email,
            upsell_offer_id_history: this.customer.upsell_offer_id_history?.offerIds || [],
            variant_id_history: this.customer.variant_id_history || []
          } : false
        },
      }
      offer.validation = validation
      offer.upsells = offer.upsells.map( upsell => {
        upsell.validation = validation
        return upsell
      })
      offer.order = offer.order || 9999999
      return offer.upsells.length ? offer : false
    })
    .filter(offer => offer)
    .sort((a,b) => a.order - b.order)  
    
    this.singleton$.next(this)

    this.updateOffers()
    this.GlobalCart.subscribe( () => {
      this.updateOffers()
    })
    
  }

  removeInvalidOFfersFromCart(){
    const itemsToRemove = this.offers
    .filter(
      ({isValid,itemsInCart,removeOnInvalid}) => !isValid && itemsInCart.length && removeOnInvalid
    ).map( offer => 
      offer.itemsInCart
    )
    .flat(1)
    .map(({key}) => {
      return {
        key:key,
        quantity:0
      }
    })
    if(itemsToRemove.length){
      this.GlobalCart.updateQty(null,null,itemsToRemove)
    }
  }

  getValidOffers(){
    return this.offers.filter(({isValid}) => isValid)
  }

  updateOffers(){
    this.offers = this.offers.map( offer  => {
      const {validation} = offer
      const validationArray = []
      // cart total validation 
      let cartTotalShow = validation.min_spend && this.cartTotalMinusBlockItems(validation.offer_id) < validation.min_spend ? false : true
      validationArray.push(cartTotalShow)
      // cart variant content validation (cart includes variants)
      let variantIdShow = true
      const variant_ids = validation.variant_ids || []
      variantIdShow = !variant_ids.length ? true : this.cartHasVariants(variant_ids)?.length
      validationArray.push(variantIdShow)
      // cart variant content validation (cart excludes variants)
      let variantExcludeIdShow = true
      const variant_excluding_ids = validation.variant_excluding_ids || []
      variantExcludeIdShow = !variant_excluding_ids.length ? true : !this.cartHasVariants(variant_excluding_ids)?.length
      validationArray.push(variantExcludeIdShow)
      
      // customer validation
      const {customer} = validation
      let customerShow = true
      // tags
      const customerTags = customer.required.tags?.split(' OR ') || []
      customerShow = !customerTags.length ? true : this.customerHasTags(customerTags)?.length
      // new customers only; new is defined as not logged in OR logged in with 0 orders
      const newCustomerOnlyValidation = customer.required?.new_customer_only
      if(newCustomerOnlyValidation && customer.current?.orders_count >= 1){
        customerShow = false
      }
      // customer order history check
      if(customer.required.customer_order_history_variants?.length){
        if(!customer.current){
          customerShow = false
        }else{
          let hasOrderedVariant = false
          for(let variant_id of customer.required.customer_order_history_variants){
            if(customer.current.variant_id_history.some(id => id == variant_id)){
              hasOrderedVariant = true
              break
            }
          } 
          customerShow = hasOrderedVariant
        }
      }
      // only allow offer to be bought once
      if(!customer.required.logic_allow_reorder){
        const offerIdsFromOrderHistory = customer.current?.upsell_offer_id_history
        if(offerIdsFromOrderHistory && offerIdsFromOrderHistory.some(id => id == validation.offer_id)){
          customerShow = false
        }
      }
      validationArray.push(customerShow)
      offer.isValid = validationArray.filter(value => value).length == validationArray.length
      // add some usefull data
      // to do : map variant IDs to global cart so we don't do this a bunch of times
      offer.itemsInCart = this.GlobalCart.cart.items.map(
        (line_item) => {
          const {variant_id,properties} = line_item
          let {_upsell_validation} = properties 
          let offer_id = false
          if(_upsell_validation){
            _upsell_validation = JSON.parse(_upsell_validation)
          }
          return _upsell_validation?.offer_id == offer.id ? {
            key: line_item.key,
            variant_id: variant_id
          } : false
        }
      ).filter(item => item)

      offer.maxItemsReached = offer.max_items && offer.itemsInCart.length == offer.max_items
      offer.upsells = offer.upsells.map( upsell => {
        upsell.addedToBag = offer.itemsInCart?.find(({variant_id}) => variant_id == upsell.id ) || false
        return upsell
      })
      offer.ObserverLite.next()
      return offer
    })
    this.removeInvalidOFfersFromCart()
  }


  cartHasVariants(variantIdArray){
    const resultsArray = variantIdArray.map(id => {
      const variantInCart = this.GlobalCart.cart.items.find((item) => item.variant_id == id)
      return variantInCart
    }).filter( item => item)
    return resultsArray
  }

  customerHasTags(tagsArray){
    const customer = this.customer
    if(!customer?.id || !customer?.tags){
      return false
    }
    const resultsArray = tagsArray.map(tag => {
      return customer.tags.find(item => item == tag) ? true : false
    }).filter( item => item)
    return resultsArray
  }

  cartTotalMinusBlockItems(offer_id){
    const lineItemsWithUpsellID = this.GlobalCart.cart.items.filter( ({properties}) => {
      if(!properties._upsell_validation){
        return false
      }
      const _upsell_validation = JSON.parse(properties._upsell_validation)
      return _upsell_validation?.offer_id == offer_id
    })
    .map(({final_price}) => final_price)
    .reduce((a, b) => a + b, 0)
    return (this.GlobalCart.cart.total_price - lineItemsWithUpsellID) / 100
  }

  // todo, add method / cart sub to remove invalid items from bag

}

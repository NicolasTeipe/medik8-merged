// deps { ObserverLite, parseHTML, DomReadyPromise, GlobalCart } loaded globally

export class GlobalVariantQtyHelper{
  constructor(settings) {
    this.ObserverLite = new ObserverLite()
    this.init(settings)
  }

  async init(settings){
    this.cart = await new GlobalCart()
    this.updateSettings(settings)
    this.cart.subscribe( () => {
      this.next()
    })
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }

  updateSettings(settings){
    this.settings = settings
    this.next()
  }

  getVariantData(){
    return new Promise( async (resolve,reject) => {
      this.cart = this.cart || await new GlobalCart()
      const inCart = this.cart.getLineItemsByVariantId(this.settings.variantId).map(({quantity}) => quantity).reduce((accumulator, currentValue) => {
        return accumulator + currentValue
      },0)
      resolve({
        stock:this.settings.variantInventoryQty,
        cart:inCart,
        remaining:this.settings.variantInventoryQty - inCart,
        managed:this.settings.variantInventoryManagement,
        data:this.settings.data
      })
    })
  }
}
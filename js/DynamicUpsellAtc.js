export class DynamicUpsellAtc extends HTMLElement {

  constructor() {
    super();
    this.ObserverLite = new ObserverLite()
  }

  get offer(){
    return this.upsellProducer.offers.find(({id}) => id == this.settings.offer_id)
  }

  get item(){
    return this.offer.upsells.find(({id}) => id == this.settings.item_id)
  }

  get state(){

    if(this.item?.addedToBag){
      return 'remove'
    }

    if(this.error || !this.offer?.isValid || this.offer?.isValid && this.offer?.maxItemsReached){
      return 'disabled'
    }

    return 'add'
  }

  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(data){
    this.ObserverLite.next(data)
  }

  connectedCallback() {
    DomReadyPromise().then( async () => {

      this.settings = {
        translations:{
          add:'Add',
          remove:'Remove'
        }
      }
      const settingsTemplete = this.querySelector(':scope > template')
      if(settingsTemplete){
        try{
          this.settings = {
            ...this.settings,
            ...JSON.parse(settingsTemplete.innerHTML)
          }
          settingsTemplete.remove()
        }
        catch(err){
          this.update('disabled')
          return
        }
      }

      this.upsellProducer = await new GlobalConditonalUpsellProducer()
      this.GlobalCart = await new GlobalCart()


      this.offer.ObserverLite.subscribe( () => {
        this.update()
      })

      this.update()
      this.bind()

    }).catch(err =>{
      console.log(err)
    })
  }  

  bind(){
    this.addEventListener('click',(e) => {
      if(this.state == 'add'){
        this.attributes.disabled = true
        this.GlobalCart.addToCart(
          {
            items:[
              {
                id:this.item.id,
                quantity:1,
                properties:{
                  _upsell_validation:JSON.stringify(this.item.validation)
                }
              }
            ]
          }
        ).then( () => {
          this.attributes.disabled = false
          this.next()
        })
        .catch( (err) => {
          this.next(err)
        })
      }
      if(this.state == 'remove'){
        this.attributes.disabled = true
        this.GlobalCart.updateQty(false,false,[
            {
              key:this.item.addedToBag.key,
              qty:0
            }
          ]
        ).then( () => {
          this.attributes.disabled = false
          this.next()
        })
        .catch( (err) => {
          this.next(err)
        })
      }
    })
  }

  update(state){
    state = state || this.state
    if(!this.settings?.translations){
      return
    }
    const {add:add_t,remove:remove_t} = this.settings.translations
    const text =  state == 'remove' ? remove_t : add_t
    this.innerHTML = `
      <button class="${this.settings.class}" type="button" ${ state == 'disabled' ? 'disabled' : ''}>${text}</button>
    `
  }
}

customElements.define('dynamic-upsell-atc', DynamicUpsellAtc);
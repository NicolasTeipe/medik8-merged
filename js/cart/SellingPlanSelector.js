// deps [parseHTML,ObserverLite,DomReadyPromise] loaded globally

export class SellingPlanSelector extends HTMLElement{
  constructor() {
    super();
    this.ObserverLite = new ObserverLite()
  }
  
  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(changes){
    this.ObserverLite.next(changes)
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
          throw err
        }
        if(this.settings){
          this.selected = this.settings.selling_plan_allocation?.selling_plan?.id || false
          this.settings.selling_plan_group.selling_plans.unshift({
            id:false,
            name:'One time only'
          })
          this.render()
        }
      }
    }).catch(err => {
      console.log(err)
    })
  }

  async bind(){ 
    this.input = this.querySelector('input')
    this.selector = this.querySelector('select')
    this.selector.addEventListener('change',(e) => {
      this.selected = this.selector.value
      this.input.value = this.selected
      this.next()
    })
  }

  render(){ 
    const discount_percentage = this.settings.selling_plan_group.discount_percentage
    const label = this.settings.translations.button_text.replace('[[amount]]',`${discount_percentage}%`)
    this.innerHTML = `
      <div class="box-selector">
        <input class="box-selector__input" type="hidden" name="selling_plan" value="${this.selected}" aria-hidden="true">
        <label class="box-selector__label">${label}</label>
        <select aria-label="${label}" name="selling_plan_select" class="box-selector__select block-12/12 select-alt-style">
          ${
            this.settings.selling_plan_group.selling_plans.map( ({name,id}) => 
              `
                <option 
                  value="${id}" 
                  ${this.selected && this.selected == id ? 'selected' : ''}>${name}
                </option>
              `
            ).join('')
          }
        </select>
      </div>
    `

    this.bind()
  }
}
customElements.define('selling-plan-selector', SellingPlanSelector);

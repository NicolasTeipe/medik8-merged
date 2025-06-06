// deps [parseHTML,ObserverLite,DomReadyPromise] loaded globally

export class GlobalBeforeAfterSlider extends HTMLElement{
  constructor() {
    super();
  }

  connectedCallback() {

    DomReadyPromise().then( async () => {
      let template = this.querySelector(':scope > template')
      if(template){
        try{
          this.settings = JSON.parse(template.innerHTML)
        }
        catch(err){
          console.log(err)
        }
        template.remove()
        template = null
      }
      this.input = this.querySelector('input')
      this.before = this.querySelectorAll('[before]')
      this.input.addEventListener('input',() => {
        this.onUpdate()
      })
    }).catch(err => {
      console.log(err)
    })
  }

  onUpdate(){
    this.before.forEach( item => item.style.width = `${this.input.value}%`)
  }
}

if (!customElements.get('global-before-after-slider')) {
  customElements.define('global-before-after-slider', GlobalBeforeAfterSlider)
}

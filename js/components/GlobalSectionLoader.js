export class GlobalSectionLoader extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    DomReadyPromise().then(async () => {
      let settingsTemplate = this.querySelector(':scope > template[data-settings]')
      let contentTemplate = this.querySelector(':scope > template[data-content]')
      if(contentTemplate){
        this.content = contentTemplate.innerHTML
        contentTemplate.remove()
        contentTemplate = null
      }
      if (settingsTemplate) {
        try {
          this.settings = JSON.parse(settingsTemplate.innerHTML)
        } catch (err) {
          console.log(err)
        }
        settingsTemplate.remove()
        settingsTemplate = null
      }
      this.setupObserver()
    }).catch(err => {
      console.log(err)
    })
  }

  setupObserver() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.init()
          observer.disconnect()
        }
      })
    }, { rootMargin: '100% 0px' })
    observer.observe(this)
  }

  async init() {
    if (this.settings?.components?.length) {
      this.loader = new DynamicImporter(
        this.settings.components.map(url => ({ type: 'js', url }))
      )
      await this.loader.load()
    }

    if(this.content){
      this.innerHTML = this.content 
    }
    
  }
}

customElements.define('global-section-loader', GlobalSectionLoader)
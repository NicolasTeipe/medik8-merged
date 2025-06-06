//deps { ObserverLite } loaded in core

export class GlobalFilterSidebar extends HTMLElement {

  constructor() { 
    super()
    this.ObserverLite = new ObserverLite()
  }

  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(){
    this.ObserverLite.next()
  }

  connectedCallback(){
    DomReadyPromise().then( async () => {
      this.hub = await new SearchResultsPageHub()
      this.bind()
    })
  }

  async bind(){
    await this.hub.ObserverLite.once()

    this.sets = this.querySelectorAll('.filter-sidebar__set')
    this.checkboxes = this.querySelectorAll('input[type="checkbox"]')
    this.reset = this.querySelector('.js-clear-filters')

    this.reset?.addEventListener('click',() => {
      this.resetFilters()
    })

    this.checkboxes.forEach( element => element.addEventListener('change',() => {
      this.update(true)
    }))

    this.updateStateFromFilters()
    this.update()
  }

  resetFilters(){
    this.checkboxes.forEach( element => {
      element.checked = false
    })
    this.update(true)
  }

  // fallback for checked state not beind added server side
  updateResetButtonState(){
    if(!this.reset) return
    if(this.hub.filters['p.tag']?.length){
      this.reset.style.display = 'block'
      this.reset.removeAttribute('aria-hidden')
    }else{
      this.reset.style.display = 'none'
      this.reset.setAttribute('aria-hidden', 'true')
    }
  }

  updateStateFromFilters(){
    this.querySelectorAll(`[value]`).forEach(element => {
      element.checked = this.hub.filters['p.tag']?.find( value => value == element.value)
    })
  }

  update(sub$){
    this.data = this.data || {}
    this.sets.forEach( form => {
      const key = form.dataset.key
      this.data[key] = Array.from( 
        form.querySelectorAll('input[type="checkbox"]:checked')
      ).map(checkbox => checkbox.value)
    })

    if(sub$){
      this.next()
    }

    this.updateResetButtonState()
  }
}

customElements.define('global-filter-sidebar', GlobalFilterSidebar);

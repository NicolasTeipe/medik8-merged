export class SearchResultsPage extends HTMLElement {

  constructor() { 
    super()
  }

  connectedCallback(){
    DomReadyPromise().then( async () => {
      this.hub = await new SearchResultsPageHub()
      await this.hub.ObserverLite.once()
      this.sections = Array.from(
        this.querySelectorAll('[data-section-type]')
      ).map((element) => {
        const {sectionType} = element.dataset
        return {
          sectionType:sectionType,
          element:element
        }
      })


      this.navigation = this.querySelector('search-results-navigation')

      await this.navigation.ObserverLite.once()
      this.updateState()

      this.navigation.subscribe(() => {
        this.updateState()
      })
    })
  }

  updateState(){
    this.sections.forEach(({sectionType,element}) => {
      if(sectionType == this.navigation.selected){
        element.style.display = 'flex'
        element.removeAttribute('aria-hidden')
      }else{
        element.style.display = 'none'
        element.setAttribute('aria-hidden',true)
      }
    })
  }

}

customElements.define('search-results-page', SearchResultsPage);

export class SearchResultsHeading extends HTMLElement {

  constructor() { 
    super()
  }

  get headerForResults(){
    return this.content_with_results.replace(
      '[[count]]',this.hub.resultsCount
    ).replace(
      '[[term]]',this.hub.results.products.query
    )
  }

  connectedCallback(){
    DomReadyPromise().then( async () => {

      this.content_no_results = this.getAttribute('content_no_results') || false
      this.content_with_results = this.getAttribute('content_with_results') || false
      if(!this.content_no_results || !this.content_with_results){
        return false
      }
      this.hub = await new SearchResultsPageHub()
      await this.hub.ObserverLite.once()
      this.render()
      this.hub.subscribe( () => {
        this.render()
      })
    })
  }

  render(){
    this.style.display = 'block'
    if(!this.hub.results){
      this.innerHTML = `<h1 class="h-style t-m f-w600">${this.content_no_results}</h1>`
      return
    }
    this.innerHTML = `<h1 class="h-style t-m f-w600">${this.headerForResults}</h1>`
  }

}

customElements.define('search-results-heading', SearchResultsHeading);
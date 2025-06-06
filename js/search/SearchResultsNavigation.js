//deps { ObserverLite } loaded in core

export class SearchResultsNavigation extends HTMLElement {

  constructor() { 
    super();
    this.ObserverLite = new ObserverLite()
  }

  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(){
    this.ObserverLite.next()
  }

  connectedCallback(){
    this.mount()
    DomReadyPromise().then( async () => {
      this.hub = await new SearchResultsPageHub()
      await this.hub.ObserverLite.once()
      this.render()
      this.hub.subscribe(() => {
        this.render()
      })
    })
  }

  mount(){
    if(!window.SearchResultsNavigationMounted){
      const style = `
        <style type="text/css">
          .search-res-nav__button{
            flex-grow:1;
            height:50px;
            display:flex;
            align-items:center;
            justify-content:center;
            border-bottom:4px solid #aaa;
            text-transform:uppercase;
            font-size:var(--t-xs);
            padding:0 var(--gutter-unit-d2);
            position:relative;
          }

          .search-res-nav__button:not(:last-child):after{
            content:'';
            width:1px;
            height:30px;
            right:0;
            top:0;
            background:#ccc;
            position:absolute;
          }

          .search-res-nav__button[data-nav-active="true"]{
            border-color:#000;
            font-weight:600;
          }
        </style>
      `
      window.SearchResultsNavigationMounted = true
      document.body.append(parseHTML(style))
    }
  }

  render(){
    this.innerHTML = ''

    let articles = this.hub?.results?.articles?.hits?.length || 0
    let products = this.hub?.results?.products?.hits?.length || 0
    const {translations} = this.hub.settings
    this.selected = 'products'
    this.innerHTML = `
      <div class="flex row-wrap align-center justify-center cell-l cell-r">
        <button class="search-res-nav__button btn-reset" data-nav-type="products">${translations.navigation.products} (${products})</button>
        <button class="search-res-nav__button btn-reset" data-nav-type="articles">${translations.navigation.articles} (${articles})</button>
      </div>
    `
    this.updateButtonState()
    this.bind()
    this.next()
  }

  updateButtonState(){
    this.querySelectorAll('[data-nav-type]').forEach( element => {
      const {navType} = element.dataset
      element.dataset.navActive = this.selected == navType
    })
  }

  bind(){
    this.querySelectorAll('[data-nav-type]').forEach( element => {
      element.addEventListener('click',() => {
        const {navType} = element.dataset
        this.selected = navType
        this.updateButtonState()
        this.next()
      })
    })
  }
}

customElements.define('search-results-navigation', SearchResultsNavigation);

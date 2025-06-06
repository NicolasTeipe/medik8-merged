
export class SearchResultsArticles extends HTMLElement {

  constructor() { 
    super()
  }

  connectedCallback(){
    DomReadyPromise().then( async () => {
      this.mount()
      this.hub = await new SearchResultsPageHub()
      await this.hub.ObserverLite.once()
      // settings are inherited from Agloia Search Header
      this.agSearchInsightsUtil = await new AgSearchInsightsUtil()
      this.render()
      this.hub.subscribe( () => {
        this.render()
      })
    })
  }

  render(){
    if(!this.hub?.results?.articles?.hits?.length){
      const {translations} = this.hub.settings
      this.innerHTML = `<p class="tac ct--x4 cb--x4">${translations.articles.empty}</p>`
      return
    }
    this.innerHTML = this.getHtmlTemplate()
    // click event tracking
    this.items = this.querySelectorAll('a[data-ag_index]')
    this.items.forEach(item => {
      item.addEventListener('click',(e) => {
        const {ag_index,ag_object_id} = item.dataset
        this.agSearchInsightsUtil.sendItemClickEvent({
          index:ag_index,
          objectIDs:[ag_object_id]
        })
      })
    })
  }

  mount(){
    if(!window.SearchResultsArticlesMounted){
      const style = `
        <style type="text/css">
          .search-res-article__image{
            width:128px;
            height:128px;
            object-fit:cover;
          }

          .search-res-article__content{
            width:calc(100% - 128px - var(--gutter-unit-d2));
          }
        </style>
      `
      window.SearchResultsArticlesMounted = true
      document.body.append(parseHTML(style))
    }
  }

  getHtmlTemplate(){
    const {articles} = this.hub.results
    const {translations} = this.hub.settings
    return `
      <div class="flex row-wrap align-stretch justify-left flex-grid-y cell-l--d2 cell-r--d2">
        ${
          articles.hits.map( (article) => {

            const href = article.blog ? 
              `/blogs/${article.blog.handle}/${article.handle}` : 
              `/pages/${article.handle}`;
            
            const image_src = article.image ? 
              `${article.image}&w=128&height=128` : 
              article.meta?.custom?.thumbnail_image_url ? 
              `${article.meta?.custom?.thumbnail_image_url}&w=128&height=128` :
              `${this.hub.settings.placeholder_image}&w=128&height=128`
            
            return `
              <a href="${href}" 
                 data-ag_index="${article.agSearchIndexName}"
                 data-ag_object_id="${article.objectID}"
                 class="cell-l--d2 cell-r--d2 flex row-wrap align-center justify-space block-6/12 @mobile__block-12/12">
                <img 
                  class="search-res-article__image" 
                  loading="lazy" 
                  src="${image_src}">
                <div class="search-res-article__content flex column-nowrap flex-grid-y--d3">
                  <span>${article.title}</span>
                  <span class="f-w600"><u>${translations.articles.thumbnail.read_more}</u></span>
                </div>
              </a>
            `
          }
          ).join('')
        }
      </div>
    ` 
  }
}

customElements.define('search-results-articles', SearchResultsArticles);



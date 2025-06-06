//deps { ObserverLite } loaded in core
export class SearchResultsProducts extends HTMLElement {

  constructor() { 
    super();
    this.filterToggle$ = new ObserverLite()
  }

  connectedCallback(){
    DomReadyPromise().then( async () => {
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
    this.innerHTML = this.getHtmlTemplate()
    this.bind()
  }

  async bind(){
    this.querySelector('.js-mobile-filters-toggle').addEventListener('click',(e) => {
      e.preventDefault()
      this.filterToggle$.next()
    })

    this.sort_by = this.querySelector('.js-sort-by')

    this.sort_by.addEventListener('change', (e) => {
      this.hub.sort_by.current = this.sort_by.value
      this.hub.update()
    })

    // wait until all products loaded
    const allProductsRendered$ = Array.from(this.querySelectorAll('global-product-thumbnail')).map( item => item.ObserverLite.once() )
    await Promise.all(allProductsRendered$)
    
    // Applied on the search page, extra checks are unnecessary.
    if(window.yotpoWidgetsContainer){
      window.yotpoWidgetsContainer.initWidgets()
    }

    // click event tracking
    this.items = this.querySelectorAll('global-product-thumbnail')
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

  getHtmlTemplate(){
    const {products} = this.hub.results
    const {translations,sort_by} = this.hub.settings
    const filtersLength = this.hub.filters['p.tag']?.length || 0
    const count = products.hits.length
    const hitsTitle = count > 1 ? translations.products.product_plural : translations.products.products_single
    return `
      <div class="flex flex-grid-y--d2 row-wrap align-top justify-space row cell-l--d2 cell-r--d2 @tablet__align-center">
        <span class="cell-l--d2 cell-r--d2 @tablet__hide">${products.hits.length} ${hitsTitle}</span>
        <div class="cell-l--d2 cell-r--d2 @tablet__block-7/12">
          <div class="gbl-styled-select block-12/12">
            <label class="gbl-styled-select__label">${sort_by.label}:</label>
            <select class="js-sort-by gbl-styled-select__select" name="SortBy">
              ${
                sort_by.values.map(
                  ({value,label}) => 
                    `<option value="${value}" ${this.hub.sort_by.current == value ? 'selected="selected"' : '' }>${label}</option>`
                ).join('')
              }
            </select>
          </div>
        </div>
        <div class="cell-l--d2 cell-r--d2 block-5/12 @tablet__show @tablet__cell-l--none">
          <button class="js-mobile-filters-toggle gbl-filter-toggle-btn block-12/12">
            <i class="wayfx-icon wayfx-icon-filter"></i>
            <span>Filters${filtersLength ? ` (${filtersLength})` : '' }</span>
          </button>
        </div>
      </div>
      ${
        !this.hub?.results?.products?.hits?.length ? (
          `<p class="tac ct--x4 cb--x4">${translations.products.empty}</p>`
        ) : (
          `
          <div class="flex row-wrap align-stretch justify-left flex-grid-y cell-l--d2 cell-r--d2">
            ${
              products.hits.map( (product) => {
                delete product._highlightResult
                delete product._snippetResult
                return `
                  <global-product-thumbnail 
                    class="d-block block-4/12 cell-l--d2 cell-r--d2 @tablet__block-6/12"
                    data-ag_index="${product.agSearchIndexName}"
                    data-ag_object_id="${product.objectID}">
                    <template>
                      {
                        "type":"ag",
                        "product":${JSON.stringify(product)},
                        "translations":{
                          "quickview":"${translations.products.thumbnail.quickview}",
                          "add_to_cart":"${translations.products.thumbnail.add_to_cart}",
                          "compare_label":"${translations.products.thumbnail.compare_label}",
                          "view_bundle":"${translations.products.thumbnail.view_bundle}"
                        }
                      }
                    </template>
                  </global-product-thumbnail>
                `
              }).join('')
            }
          </div>
          `
        )
      }
    `
  }
}

customElements.define('search-results-products', SearchResultsProducts);



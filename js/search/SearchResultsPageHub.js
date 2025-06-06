//deps { ObserverLite } loaded in core

export class SearchResultsPageHub{
  constructor(settings){

    const singleton$ = new ObserverLite({key:'searchHub$'})

    if(!settings){
      return new Promise( async (resolve,reject) => {
        const instance = await singleton$.once()
        resolve(instance)
      })
    }

    this.settings = settings
    this.sort_by = settings.sort_by
    this.ObserverLite = new ObserverLite()
    this.agSearch = new AgSearchUtil({
      app_id:settings.app_id,
      search_api_key:settings.search_api_key
    })
 
    this.results = false
    singleton$.next(this)
    this.filters = this.getFilterParamsFromUrl()
    this.sort_by.current = this.sortParamsFromUrl || this.sort_by.values[0].value    
    this.search()
  }

  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(){
    this.ObserverLite.next()
  }

  get sortParamsFromUrl(){
    const params = new URLSearchParams(window.location.search)
    const sort_by =  params.get('sort_by')
    return sort_by
  }
  
  getFilterParamsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const obj = {}
    for (const [key, value] of params) {
      if (key.startsWith('filter.')) {
        const newKey = key.replace('filter.','')
        if (!obj[newKey]) {
          const values = value.split(',').filter( val => val.length)
          obj[newKey] = values
        } else {
          const values = value.split(',').filter( val => val.length)
          obj[newKey] = [...new Set([...obj[newKey], ...values])]
        }
      }
    }
    return obj
  }

  getFilterUrlFromParams(){
    const baseUrl = window.location.href.split('?')[0]
    const params = new URLSearchParams(window.location.search)
    Array.from(params.keys()).forEach(key => {
      if (key.startsWith('filter.') || key.startsWith('sort_by')) {
        params.delete(key)
      }
    })
  
    // Add new filter parameters from the object
    Object.entries(this.filters).forEach(([key, values]) => {
      params.set(`filter.${key}`, values.join(','))
    });
  
    params.set('sort_by', this.sort_by.current)

    return `${baseUrl}?${params.toString()}`
  };

  search(){
    const params = new URLSearchParams(window.location.search)
    const query =  params.get('q')

    if(!query){
      this.next()
    }

    const facetFilters = 
      !this.filters['p.tag']?.length ? 
      false :
      this.filters['p.tag'].map( value => `tags:${value}` )

    this.agSearch.search({
      query:query,
      indexes:[
        {
          indexName: `${this.settings.index_prefix}products`,
          key: 'products',
          facets:['tags'],
          facetFilters:[facetFilters] || false,
          
          attributesToRetrieve:[
            'objectID','title','image','handle','objectID','variant_title','meta','price','compare_at_price','inventory_quantity','id','position','product_type'
          ],
          
          hitsPerPage:100
        },
        {
          indexName: `${this.settings.index_prefix}pages`,
          key: 'pages',
          attributesToRetrieve:[
            'objectID','handle','title','meta'
          ],
        },
        {
          indexName: `${this.settings.index_prefix}articles`,
          key: 'articles',
          attributesToRetrieve:[
            'objectID','blog','image','handle','title'
          ],
        }
      ],
      merge:{
        indexes:['pages','articles'],
        key:'articles'
      }
    }).then( data => {
      this.results = data
      this.results.products.hits = this.results.products.hits.map((item,index) => {
        item.index = index
        return item
      })
      this.terms = query
      this.resultsCount = data?.products?.hits?.length || 0
      this.resultsCount = this.resultsCount + (data?.articles?.hits?.length || 0)
      this.update()
    }).catch(err => {
      this.next()
      console.log(err)
    })
  }

  update(){
    this.results.products.hits = this.results.products.hits.sort( 
      (a,b) => {
        const sort_by = this.sort_by.current
        if(sort_by == 'relevance'){
          return a.index - b.index
        }

        if(sort_by == 'price-ascending'){
          return a.price - b.price
        }

        if(sort_by == 'price-descending'){
          return b.price - a.price
        }
        return true
      }
    )
    this.next()
    document.title = this.settings.title_tag.replace(
      '[[term]]', this.terms
    ).replace(
      '[[count]]', this.resultsCount
    )
    history.replaceState(null, '', this.getFilterUrlFromParams());
  }
}

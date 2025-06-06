import { searchClient } from '@algolia/client-search'
import insightsClient from 'search-insights'
/**
* wrapper for client, see https://dashboard.algolia.com/account/api-keys/all for params
* @param {string} app_id
* @param {string} search_api_key

const agSearch = new AgSearchUtil({
  app_id:'YB1RTQO0UX',
  search_api_key:'eb35e06716a7bf9522c67c0cc78326a4'
})

agSearch.search({
  query:'crystal',
  indexes:[
    {
      indexName: 'ukproducts',
      key: 'products'
    },
    {
      indexName: 'ukarticles',
      key: 'articles'
    }
  ]
}).then( data => {
  console.log(data)
})

*/

export class AgSearchInsightsUtil{
  constructor(settings){
    this.singleton$ = new ObserverLite({key:'AgSearchInsightsUtil$'})

    if(!settings){
      return new Promise( async (resolve,reject) => {
        const instance = await this.singleton$.once()
        resolve(instance)
      })
    }

    this.settings = settings
    this.init()
  }

  async init(){
    
    insightsClient('init', {
      appId: this.settings.app_id,
      apiKey: this.settings.search_api_key,
      useCookie: false,
    })
    this.singleton$.next(this)
    const customerPrivacyApi$ = new ObserverLite({key:'Shopify.customerPrivacyApi'})
    const {analyticsAllowed} = await customerPrivacyApi$.once()
    if(analyticsAllowed){
      insightsClient('init', {
        appId: this.settings.app_id,
        apiKey: this.settings.search_api_key,
        useCookie: true,
      })
    }  
  }


  sendItemClickEvent(params){
    insightsClient('clickedObjectIDsAfterSearch', {
      eventName: 'Product Clicked',
      index: params.index,
      objectIDs: params.objectIDs
    });
  }
}

export class AgSearchUtil{
  constructor(settings){
    this.settings = settings
    this.client = searchClient(this.settings.app_id,this.settings.search_api_key) 

  }
  
  /**
  * wrapper for client search
  * @param {string} query - search terms.
  * @param {Object[]} indexes - array of indexes to search.
  * @param {key} indexes.key - key, for your reference, e.g. products, articles
  * @param {string} indexes.indexName - name of index in algolia. Specifc to an instance of algolia
  * @param {number} indexes.hitsPerPage - number of results
  * @param {number} indexes.facetFilters - fecet filters (https://api-clients-automation.netlify.app/docs/clients/guides/filtering-your-search)
  * @param {string[]} indexes.facets - number of results
  * @param {string[]} indexes.attributesToRetrieve - which attributes to fetch for each item
  * @returns {Object} results for each index, using indexes.key as key.
  * 
  * search({
      query:'crystal',
      indexes:[
        {
          indexName: 'ukproducts',
          key: 'products',
          hitsPerPage:10,
          facets: ['*'],
        },
        {
          indexName: 'ukarticles',
          key: 'articles',
          hitsPerPage:10,
          facets: ['*'],
        }
      ]
    })
  */
 
  search({query,indexes,merge}){
    return new Promise((resolve,reject) => {
      if(!indexes?.length || !query){
        reject({error:'no terms or indexes'})
      }
      this.client.search({
        requests: indexes.map( ({indexName,hitsPerPage,facets,facetFilters,attributesToRetrieve }) => {
          hitsPerPage = hitsPerPage || 10
          facets = facets || ['*']
          attributesToRetrieve = attributesToRetrieve || ['*']
          return  {
            indexName: indexName,
            query: query,
            hitsPerPage: hitsPerPage,
            facets: facets,
            facetFilters: facetFilters,
            attributesToRetrieve: attributesToRetrieve
          }
        })
      }).then( ({results}) => {
        // add the index to each "hit"
        results = results.map( item => {
          item.hits = item.hits.map( hit => {
            hit.agSearchIndexName = item.index
            return hit
          })
          return item
        })
        results = results.reduce((obj, currentValue) => {
          const key = indexes.find(({indexName}) => indexName == currentValue.index)?.key || currentValue.index
          obj[key] = currentValue;
          return obj;
        }, {});
      
        if(merge){
          const hits = merge.indexes.map( key => results[key].hits ).flat(1)
          merge.hits = hits
          merge.merge = true
          merge.datasets = merge.indexes.map( key => results[key] ).flat(1)
          merge.indexes.forEach(key => delete results[key])
          results[merge.key] = merge
        }
        resolve(results)
      }).catch(err => {
      
        reject({error:err})
      })
    })
  }
}


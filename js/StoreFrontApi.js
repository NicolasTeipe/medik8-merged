export class StoreFrontApi{
  constructor(settings){

    const singleton$ = new ObserverLite({key:'StoreFrontApi$'})

    if(!settings){
      return new Promise( async (resolve,reject) => {
        const instance = await singleton$.once()
        resolve(instance)
      })
    }else{
      this.ObserverLite = new ObserverLite()
      this.endpoint = `${settings.storeUrl}/api/${settings.version}/graphql.json`
      this.accessToken = settings.accessToken
      singleton$.next(this)
    }

  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }

  authFetch(params){
    const fetchParams = {
      method:params?.method || 'POST',
      headers: {
        "Content-Type": "application/graphql",
        'X-Shopify-Storefront-Access-Token':this.accessToken
      },
    }
    if(params?.body) {
      fetchParams.body = params.body
    }
    return new Promise( (resolve,reject) => {
      fetch(this.endpoint, fetchParams)
      .then( response => response.json())
      .then( data => {
        resolve(data)
      })
      .catch(err => {
        reject(err)
      })
    })
  }
}
// deps { ObserverLite } loaded globally

export class DynamicImporter {
  constructor(items) {
    if (window.DynamicImporterSingleton) {
      window.DynamicImporterSingleton.items = window.DynamicImporterSingleton.items.concat(
        items.filter((item) => !this.items?.find(({ url }) => item.url !== url))
      );
      return window.DynamicImporterSingleton;
    }
    this.observer = new ObserverLite();
    this.items = items;
    window.DynamicImporterSingleton = this;
  }

  async loadScript(item){
    if (item.type === 'js') {
      const url = item.url.split('//')
      item.url = `https://${url[1]}`
      item.loading =  item.loading || new Promise( (resolve,reject) => {
        import(/* webpackIgnore: true */`${item.url}`)
        .then( mod => {
          item.loaded = true
          resolve(mod)
        })
        .catch(err => {
          console.log(err)
          reject({error:true})
        })
      })
    } else {
      item.loading = item.loading || new Promise((resolve) => {
        try {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = item.url;
          document.head.appendChild(link);
          link.onload = () => {
            item.loaded = true;
            resolve(link)
          }
        }catch(err){
          console.log(err)
          reject({error:true})
        }
      })
    }
    
    return item.loading 
  }

  load() {
    return new Promise( (resolve,reject) => {
      const promises = this.items
      .filter(({ loaded }) => !loaded)
      .map(item => this.loadScript(item));
  
      Promise.all(promises).then( results => { 
        this.observer.next()
        resolve({results:results})
      }).catch(err => {
        resolve({error:true})
      })
    })
    
  }
}


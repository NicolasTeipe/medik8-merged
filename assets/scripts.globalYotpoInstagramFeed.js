
export class YotpoObserver{
  constructor(){
    this.id =  Math.floor(Math.random() * 999999999999)
    this.observer$ = new ObserverLite()
    this.init()
  }

   init(){
    this.yotpoAPI = window.Yotpo && yotpo ? new window.Yotpo.API(yotpo) : false
    if(!this.yotpoAPI){
      this.waitForYotpo().then( () => {
        this.yotpoAPI = new window.Yotpo.API(yotpo)
        this.observer$.next()
      }).catch(err => {
        // TODO: DY this fails aways not sure if this global script still in use.
        // console.log('error loading yotpo')
      })
    }
  }

  waitForYotpo(){
    return new Promise( (resolve,reject) => {
      const loaded = (tries) => {
        tries = tries || 0
        tries++
        if(!window.Yotpo){
          // console.log('waiting for yotpo')
          if(tries < 50){
            setTimeout( () => {
              loaded(tries)
            },400)
          }else{
            reject()
          }
        }else{
          resolve()
        }
      }
      loaded()
    })
  }
}

export class DynanicRenderSection {
  constructor({element,content}){
    this.rendered = false
    if(element && content){
      this.id =  Math.floor(Math.random() * 999999999999)
      this.observer$ = new ObserverLite()
      this.element = element
      this.content = content
      new IntersectionObserver(this.renderSection.bind(this), {rootMargin: `0px 0px ${window.innerHeight}px 0px`}).observe(this.element)
    }
  }

  renderSection(entries, observer){
    if (!entries[0].isIntersecting || this.rendered) return
    this.rendered = true
    observer.unobserve(this.element)
    this.element.innerHTML = this.content.innerHTML
    this.observer$.next()
  }
}

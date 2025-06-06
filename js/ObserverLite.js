export class ObserverLite {
  
  constructor(settings){
    settings = settings || {}
    this.id =  Math.floor(Math.random() * 999999999999)
    this.settings = settings
    if(settings.key){
      window.GlobalObersverLiteInstances = window.GlobalObersverLiteInstances || {}
      if(window.GlobalObersverLiteInstances[settings.key]){
        return window.GlobalObersverLiteInstances[settings.key]
      }else{
        window.GlobalObersverLiteInstances[settings.key] = this
      }
    }
  }

  once(){
    return new Promise( (resolve,reject) => {
      if(this.onceDone){
        resolve(this.onceDone)
      }
      const subscription = this.subscribe( (data) => {
        data = data || true
        this.onceDone = data
        resolve(data)
        this.unsubscribe(subscription)
      })
    })
  }

  setOnce(data){
    data = data || true
    this.onceDone = data
  }
  
  next(...args) {
    if(!this.onceDone){
      this.setOnce(...args)
    }
    if (this.subject && this.subject.length) {
      this.subject.forEach(({callback}) => {
        callback(...args);
      });
    }
  }

  subscribe(callback){
    this.subject = this.subject || []
    callback = {
      callback:callback,
      id:Math.floor(100000000000000 + Math.random() * 900000000000000)
    }
    this.subject.push(callback)
    return callback
  } 

  unsubscribe(callback) {
    this.subject = this.subject.filter( ({id}) => id !== callback.id )
  }

  unsubscribeAll(resetOnce){
    this.subject?.forEach( callback => this.unsubscribe(callback))
    if(resetOnce){
      this.onceDone = false
    }
  }

}
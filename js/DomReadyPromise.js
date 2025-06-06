export function DomReadyPromise(){
  return new Promise(function(resolve,reject){
    if (document.readyState !== 'loading') {
      resolve()
    }else{
      addEventListener('DOMContentLoaded', () => {
       resolve()
      })
    }
  })
}
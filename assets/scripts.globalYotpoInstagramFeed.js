/**
 * @class YotpoObserver
 * @classdesc Monitors the availability of the Yotpo API and initializes it when available.
 * Provides an observable (`observer$`) that emits when Yotpo is ready.
 *
 * @example
 * // Create an instance of YotpoObserver
 * const yotpoObserver = new YotpoObserver();
 *
 * // Subscribe to the observer to be notified when Yotpo is ready
 * yotpoObserver.observer$.subscribe(() => {
 *   console.log('Yotpo is now available');
 *   // Perform actions that require Yotpo API here
 * });
 *
 * @description
 * - Automatically checks if Yotpo is available on `window`.
 * - Waits up to 20 seconds (50 retries with 400ms delay) for Yotpo to load.
 * - Emits an event when Yotpo is successfully initialized.
 */

export class YotpoObserver {
  constructor() {
    // Generate a unique ID for this instance
    this.id = Math.floor(Math.random() * 999999999999)

    // Create an instance of ObserverLite for event observation
    this.observer$ = new ObserverLite()

    // Initialize the Yotpo integration
    this.init()
  }

  init() {
    // Check if Yotpo API is available in the global scope and instantiate it
    this.yotpoAPI = window.Yotpo && yotpo ? new window.Yotpo.API(yotpo) : false

    // If Yotpo API is not available, wait for it to load
    if (!this.yotpoAPI) {
      this.waitForYotpo()
        .then(() => {
          // Once Yotpo is available, instantiate the API and notify observers
          this.yotpoAPI = new window.Yotpo.API(yotpo)
          this.observer$.next() // Notify subscribers that Yotpo is ready
        })
        .catch((err) => {
          // TODO: DY - This fails always, not sure if this global script is still in use.
          // console.log('error loading yotpo')
        })
    }
  }

  waitForYotpo() {
    return new Promise((resolve, reject) => {
      const loaded = (tries = 0) => {
        tries++

        // Check if Yotpo is available in the global scope
        if (!window.Yotpo) {
          // console.log('waiting for yotpo')

          // Retry up to 50 times with a 400ms delay
          if (tries < 50) {
            setTimeout(() => loaded(tries), 400)
          } else {
            reject() // Reject if Yotpo never loads
          }
        } else {
          resolve() // Resolve once Yotpo is available
        }
      }

      // Start checking for Yotpo
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
    // if (!entries[0].isIntersecting || this.rendered) return
    this.rendered = true
    observer.unobserve(this.element)
    this.element.innerHTML = this.content.innerHTML
    this.observer$.next()
  }
}

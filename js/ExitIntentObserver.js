export class ExitIntentObserver {
  constructor() {
    this.ObserverLite = new ObserverLite()
    this.startTime = Date.now()
    this.leaveCount = 0
    this.init()
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }

  init() {
    const debounce = (func, delay) => {
      let inDebounce
      return (...args) => {
        clearTimeout(inDebounce)
        inDebounce = setTimeout(() => func(...args), delay)
      }
    }
  
    this.startTime = Date.now()
    this.leaveCount = 0
  
    const handleMouseleave = debounce(() => {
      const currentTime = Date.now()
      const timeElapsed = (currentTime - this.startTime) / 1000
      this.leaveCount++
      const eventData = {
        time: timeElapsed,
        count: this.leaveCount
      }
      this.next(eventData)
    }, 100)
  
    const handleMouseout = (event) => {
      if (event.relatedTarget === null) {
        handleMouseleave()
      }
    }
  
    window.addEventListener('mouseout', handleMouseout)
  }
}
// deps { ObserverLite, parseHTML, DomReadyPromise, GlobalCart } loaded globally

export class TrapFocusLite {

  constructor(element){
    this.ObserverLite = new ObserverLite()
    this.element = element
    this.element.addEventListener('keydown', (e) => {
      this.keyDownHandler(e)
    })
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }

  setAttributes(el, object){
    for (let key in object) {
      el.setAttribute(key, object[key])
    }
  }

  removeAttributes(el, attrbutes){
    attrbutes.forEach(key => {
      el.removeAttribute(key)
    })
  }

  get focusables(){
    return this.element.querySelectorAll(
        'summary, [tabindex="0"], [role="button"], a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])'
      )
  }

  setFocus(){
    this.lastFocusedElement = document.activeElement
    this.focusables[0]?.focus()
  }

  resetFocus(){
    this.lastFocusedElement.focus()
  }

  keyDownHandler(e){
    const focusableEls = this.focusables
    const firstFocusableEl = focusableEls[0]
    const lastFocusableEl = focusableEls[focusableEls.length - 1]
    const KEYCODE_TAB = 9

    var isTabPressed = (e.key === 'Tab' || e.keyCode === KEYCODE_TAB)

    if (!isTabPressed) { 
      this.next({
        key:e.key
      })
      return
    }

    if ( e.shiftKey ) {
      if (document.activeElement === firstFocusableEl) {
        e.preventDefault()
        lastFocusableEl.focus()
      }
    } else{
      if (document.activeElement === lastFocusableEl) {
        e.preventDefault()
        firstFocusableEl.focus()
      }
    }
  }
}
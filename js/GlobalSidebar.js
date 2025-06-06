// deps { ObserverLite, parseHTML, DomReadyPromise, GlobalCart } loaded globally

import { TrapFocusLite } from "./TrapFocusLite";

export class GlobalSidebar extends HTMLElement {

  constructor() {
    super();
    this.hasMenuBeenInit = false
    this.ObserverLite = new ObserverLite()
    this.cartCloseBtnTimeout
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }

  connectedCallback() {
    this.containerRight = this.attributes.container_right ? true : false
    this.buttonLeft = this.attributes.button_left ? true : false
    this.renderedOnInit = this.attributes.rendered_on_Init ? true : false
    this.observer_key = this.attributes.observer_key ? this.attributes.observer_key.value : false

    // if sidebar is pre-rendered, run binding etc
    if(this.renderedOnInit){
      this.initRender()
    }
    
    if(this.observer_key){
      const init$ = new ObserverLite({key:this.observer_key})
      init$.next(this)
    }
  }

  toggle(){
    if(this.isOpen){
      this.close()
    }else{
      this.open()
    }
  }
   // checks to see if wrapper has been passed as stabdard content
  addWrapper(){
    this.wrapper = this.querySelector('.modal-wrapper') || false
    if(!this.wrapper){
      return
    }
    this.mask = this.wrapper.querySelector('.modal-mask') 
    this.contentWrapper = this.wrapper.querySelector('.modal-sidebar') 
    this.closeButton = this.wrapper.querySelector('.modal-close-btn')
  }

  initRender(){
    this.addWrapper()

    if (!this.wrapper) {
      this.content = this.querySelector(':scope > template')?.content || this.children[0]
      let wrapper = `<div class="modal-wrapper">
                         <div class="modal-mask modal-close"></div>
                         <div class="modal-sidebar"></div>
                       </div>`
      wrapper = parseHTML(wrapper)
      this.wrapper = wrapper.querySelector('.modal-wrapper')
      this.mask = wrapper.querySelector('.modal-mask')
      this.contentWrapper = wrapper.querySelector('.modal-sidebar')
      this.contentWrapper.appendChild(this.content)
      this.appendChild(wrapper)
    }

    this.next({
      render: true
    })

    if(!this.isBound){
      this.isBound = true
      if (this.containerRight) {
        this.contentWrapper.style.left = 'auto'
        this.contentWrapper.style.right = '0px'
      }
      if(this.buttonLeft){
        this.closeButton.classList.add('modal-close-btn--left')
      }
      
      // Cart closing logic - drawer close button logic is below
      this.wrapper.querySelectorAll('.modal-close').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault()

          const burgerButton = document.querySelector(".mh__icon-nav-item--mob-menu")
          const cartButton = document.querySelector(".js-cart-toggle")
          
          // Close mobile menu
          if (burgerButton) {
            if( document.body.classList.contains('mobile-menu')) {
              clearTimeout(this.cartCloseBtnTimeout)
              this.cartCloseBtnTimeout = setTimeout(() => {
                document.body.classList.remove('mobile-menu')
              }, 222);
            }

            burgerButton.classList.remove('active')
            burgerButton.setAttribute('aria-expanded', 'false');
          }

          // Set cart aria to false
          if (cartButton) {
            cartButton.setAttribute('aria-expanded', 'false');
          }

          // Closing the nav
          this.close()
        })
      })

      this.TrapFocusLite = new TrapFocusLite(this)
      this.TrapFocusLite.subscribe(({key}) => {
        if(key == 'Escape'){
          this.close()
        }
      })
    }

    this.isInitRendered = true

  }

  open() {
    if(!this.isInitRendered){
      this.initRender()
    }

    const scrollbarWidth = window.innerWidth - document.body.clientWidth
    document.body.classList.add('body-masked')
    document.body.style.paddingRight = `${scrollbarWidth}px`

    this.wrapper.style.display = 'block'
    this.wrapper.animate([{
        opacity: 0
      }, {
        opacity: 1
      }], 300)
      .onfinish = (e) => {
        e.target.effect.target.style.opacity = 1
      }

    const tranlsate = this.containerRight ? '150px' : '-150px'
    this.contentWrapper.animate([{
        transform: `translateX(${tranlsate})`,
        opacity: 0
      }, {
        transform: 'translateX(0px)',
        opacity: 1
      }], 200)
      .onfinish = (e) => {
        e.target.effect.target.style.transform = 'translateX(0px)'
        e.target.effect.target.style.opacity = 1
        this.TrapFocusLite.setFocus()

        this.TrapFocusLite.setAttributes(this,{
          'role':'dialog',
          'aria-modal':'true',
          'aria-live':'assertive'
        })
        this.TrapFocusLite.removeAttributes(this,[
          'aria-hidden',
        ])
        this.next({
          open: true
        })
      }
  }

  close() {
    this.wrapper.animate([{
        opacity: 1
      }, {
        opacity: 0
      }], 200)
      .onfinish = (e) => {
        e.target.effect.target.style.opacity = 0
        e.target.effect.target.style.display = 'none'
        document.body.classList.remove('body-masked')
        document.body.style.paddingRight = `0px`
        this.TrapFocusLite.resetFocus()
        this.TrapFocusLite.removeAttributes(this,[
          'role',
          'aria-modal',
          'aria-live'
        ])
        this.TrapFocusLite.setAttributes(this,{
          'aria-hidden':'true'
        })
        this.next({
          open: false
        })
      }

    this.contentWrapper.animate([{
        transform: 'scale(1)',
        opacity: 1
      }, {
        transform: 'scale(1.2)',
        opacity: 0
      }], 200)
      .onfinish = (e) => {
        e.target.effect.target.style.opacity = 0
      }
  }
}
customElements.define('global-sidebar', GlobalSidebar);
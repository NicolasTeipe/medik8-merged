// deps { ObserverLite, parseHTML, DomReadyPromise, GlobalCart } loaded globally

import { TrapFocusLite } from "./TrapFocusLite";

export class ModalBox{
  constructor({content,settings}){
  
    if(window.ModalBoxInstance){
      window.ModalBoxInstance.close()
    }
    window.ModalBoxInstance = this
    this.content = content
    this.settings = settings || {
      containerCloseButton:true
    }
    this.ObserverLite = new ObserverLite()
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback);
  }

  next(data) {
    this.ObserverLite.next(data);
  }
  
  toggle(){
    if(!this.active){
      this.open()
    }else{
      this.close()
    }
  }

  open(){
    this.active = true
    this.next({
      type:'open'
    })
    return new Promise( (resolve,reject ) => {
      if(!this.wrapper){
        let wrapper = `<div class="modal-wrapper ${this.settings.wrapperClass ? this.settings.wrapperClass : ''}"
                            style="${this.settings.wrapperStyles ? this.settings.wrapperStyles : ''}">
                         <div class="modal-mask modal-close"></div>
                         <div class="modal-flex ${this.settings.flexClass ? this.settings.flexClass : ''}">
                           <div class="modal-content  
                                       ${this.settings.contentClass ? `${this.settings.contentClass}` : '' }
                                       ${this.settings.overlayClose ? 'modal-close' : ''}">
                              ${ this.settings.containerCloseButton ? '<button aria-label="close" class="modal-close modal-close-btn btn-reset"></button>' : '' }
                           </div>
                         </div>
                       </div>`
        wrapper = parseHTML(wrapper) 
        this.wrapper = wrapper.querySelector('.modal-wrapper') 
        this.wrapper.style.opacity = 0
        this.mask = wrapper.querySelector('.modal-mask')
        this.content = parseHTML(this.content)
        this.contentWrapper = wrapper.querySelector('.modal-content')
        this.contentWrapper.style.opacity = 0
        this.contentWrapper.appendChild(this.content)
        wrapper.querySelectorAll('.modal-close').forEach(item => {
          item.addEventListener('click',(e) => {
            e.preventDefault()
            this.close()
          })
        })
        document.body.appendChild(wrapper)
        this.TrapFocusLite = new TrapFocusLite(this.wrapper)
        this.TrapFocusLite.subscribe(({key}) => {
          if(key == 'Escape'){
            this.close()
          }
        })
      }
      const scrollbarWidth = window.innerWidth - document.body.clientWidth
      document.body.classList.add('body-masked')
      //document.body.style.paddingRight = `${scrollbarWidth}px`
      this.wrapper.style.display = 'block'
      this.wrapper.animate([{opacity: 0},{ opacity: 1}], 300)
      .onfinish = (e) => {
        e.target.effect.target.style.opacity = 1
      }

      this.contentWrapper.animate([{ transform: 'translateY(100px)',opacity:0},{ transform: 'translateY(0px)',opacity:1}], 300)
      .onfinish = (e) => {
        e.target.effect.target.style.transform = 'translateY(0px)'
        e.target.effect.target.style.opacity = 1
        this.TrapFocusLite.setFocus()

        this.TrapFocusLite.setAttributes(this.wrapper,{
          'role':'dialog',
          'aria-modal':'true',
          'aria-live':'assertive'
        })
        this.TrapFocusLite.removeAttributes(this.wrapper,[
          'aria-hidden',
        ])
        this.next({
          type:'open:rendered'
        })
        resolve()
      }
    })
  }

  close(){
    this.active = false
    this.next({
      type:'close'
    })
    this.wrapper.animate([{opacity: 1},{ opacity: 0}], 200)
    .onfinish = (e) => {
      e.target.effect.target.style.opacity = 0
      document.body.classList.remove('body-masked')
      document.body.style.paddingRight = `0px`
      this.wrapper.style.display = 'none'
    }

    this.contentWrapper.animate([{ transform: 'scale(1)', opacity:1},{ transform: 'scale(1.2)', opacity:0 }], 200)
    .onfinish = (e) => {
      e.target.effect.target.style.opacity = 0
      this.TrapFocusLite.resetFocus()
      this.TrapFocusLite.removeAttributes(this.wrapper,[
        'role',
        'aria-modal',
        'aria-live'
      ])
      this.TrapFocusLite.setAttributes(this.wrapper,{
        'aria-hidden':'true'
      })
      this.next({
        type:'close:finish'
      })
    }
  }

  destroy(){
    this.wrapper.remove()
  }
}
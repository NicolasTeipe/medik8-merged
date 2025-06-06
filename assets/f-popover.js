const fPopBind = () => {

  function bindOpenTriggers(){
    const triggers = [...document.querySelectorAll('.f-popover-trigger:not([data-bound])')];
    triggers.forEach(trigger => {
      trigger.dataset.bound = true
      trigger.addEventListener('click', e => {
        e.preventDefault();
        const targets = document.querySelectorAll(trigger.dataset.target);
        targets.forEach(target => {
          document.body.style.overflow = 'hidden';
          target.classList.toggle('is-visible');
          const {bound} = target.dataset
          const trapFocus = new TrapFocusLite(target)  
          trapFocus.setFocus()     
          
          trapFocus.setAttributes(target,{
            'role':'dialog',
            'aria-modal':'true',
            'aria-live':'assertive'
          })
          
          trapFocus.removeAttributes(target,[
            'aria-hidden',
          ])
    
          if(bound) return
    
          target.dataset.bound = true
          document.body.appendChild(target);
          trapFocus.subscribe(({key}) => {
            if(key == 'Escape'){
              const closeButton = target.querySelector('.f-popover-close')
              closeButton?.dispatchEvent(new MouseEvent('click'))
            }
          })
    
          // special case for OOS form to trap focus on form submit
          const OOSform = target.querySelector('f-oos-notify')
          if(OOSform){
            OOSform.ObserverLite.subscribe(() => {
              trapFocus.setFocus()
            })
          }
          bindCloseTriggers()
        });
      });
    });
  }
  
  function bindCloseTriggers(){
  
    const closeTriggers = [
      ...document.querySelectorAll('.f-popover-overlay:not([data-bound])'),
      ...document.querySelectorAll('.f-popover-close:not([data-bound])'),
    ];
  
    closeTriggers.forEach(trigger => {
      trigger.dataset.bound = true
      trigger.addEventListener('click', e => {
        e.preventDefault();
        const modal = e.target.closest('.f-popover');
        modal.classList.remove('is-visible');
        document.body.style.overflow = 'auto';
        const trapFocus = new TrapFocusLite(modal)  
    
        trapFocus.removeAttributes(modal,[
          'role',
          'aria-modal',
          'aria-live'
        ])
        
        trapFocus.setAttributes(modal,{
          'aria-hidden':'true',
        })
    
      });
    });
  }

  bindOpenTriggers()
}

DomReadyPromise().then( () => {
  fPopBind()
}).catch(err => {
  console.log(err)
})

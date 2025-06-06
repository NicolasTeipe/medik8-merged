// deps { DomReadyPromise } loaded globally

export class AccountRegisterEmailCapture extends HTMLElement {

  constructor() {
    super();
   
  }

  connectedCallback() {
    DomReadyPromise().then( () => {
      const signUpForm = this.closest('form[action="/account"]')
      const list_id = this.attributes?.list_id?.value || false
      const key = this.attributes?.key?.value || false
      const source = 'Register Account'
      const email = signUpForm?.querySelector('input[type="email"]') || false
      if(!signUpForm || !list_id || !key || !email ){
        this.remove()
        return
      }
      signUpForm.addEventListener('submit', async (e) => {
        const accepted = this.querySelector('#accepts_marketing')?.checked || false
        if(accepted){
          e.preventDefault()
          e.stopPropagation()
  
          const formData = new FormData()
          formData.append('list_id', list_id)
          formData.append('key', key)
          formData.append('source', source)
          formData.append('email', email.value)
          
          await klaviyoSubscribe(false,formData)
  
          signUpForm.submit() 
        }
      }, true)
    }).catch(err => {
      console.log(err)
    })
  }


}

customElements.define('account-register-email-capture', AccountRegisterEmailCapture);
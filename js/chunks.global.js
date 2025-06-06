export { GlobalSidebar } from './GlobalSidebar.js';
export { GlobalQtySelector } from './GlobalQtySelector.js';
export { GlobalVariantQtyHelper }  from './GlobalVariantQtyHelper.js';
export { GlobalCartProgressBar , GlobalCartProgressBarTiersProducer } from './GlobalCartProgressBar';
export { NiceScroll } from './NiceScroll'
export { ModalBox } from "./ModalBox"
export { DynamicImporter } from './DynamicImporter';
export { customerPrivacyApi } from './customerPrivacyApi.js'
export { klaviyoSubscribe } from './KlaviyoSubscribe.js';
export { AccountRegisterEmailCapture } from './AccountRegisterEmailCapture'
export { TrapFocusLite } from "./TrapFocusLite";
export { AlgoliaSearchHeader } from './AlgoliaSearchHeader.js';
export { GlobalConditonalUpsellProducer } from './GlobalConditonalUpsellProducer';
export { ExitIntentObserver } from './ExitIntentObserver';
export { DynamicUpsellAtc } from './DynamicUpsellAtc';
export { GlobalCarousel } from './GlobalCarousel';
export { GlobalHotspotTarget , GlobalHotspotItem } from './GlobalHotspots.js';


export { SidebarCart, SidebarCartLayout , SidebarCartSection } from './cart/SidebarCart';
export { SellingPlanSelector } from './cart/SellingPlanSelector';
export { CartItems } from './cart/CartItems';
export { CartLineItem } from './cart/CartLineItem';
export { CartFooterMain } from './cart/CartFooterMain';
export { CartIconBanner } from './cart/CartIconBanner';
export { CartBeam } from './cart/CartBeam';
export { CartMessageBar } from './cart/CartMessageBar';
export { GlobalProductCard } from './components/dist/GlobalProductCard'

import { DomReadyPromise } from './DomReadyPromise.js';
import { ModalBox } from "./ModalBox";

export { CountriesData } from './v2-navigation/CountriesData'
export { GlobalCountySelector } from './v2-navigation/GlobalCountrySelector'
export { CountdownTimer } from './components/CountDownTImer'

// Listen for click events for #account and open sign up modal / redirect to account
// TODO, maybe move this to another chunk TBC, EG chunk for cart only, chunk for other global core functions (observer, domready) ... or load them inline
DomReadyPromise().then( () => {
  let loginModal = false
  const toggleModalButtons = document.querySelectorAll('[href="#account"], [account-modal]')
  toggleModalButtons.forEach( item => item.addEventListener('click', async (e) => {
    e.preventDefault()
    if(window.customer_logged_in){
      window.location.href = '/account'
      return
    }
    if(!loginModal){
      await new Promise( (resolve,reject) => {
        fetch(`${window.Shopify.routes.root}?sections=account__login-form`)
        .then( response => response.json() )
        .then( data => {
          if(!data?.['account__login-form']){
           reject()
           return
          }
          loginModal = new ModalBox({
            content: data['account__login-form'],
            settings:{
              contentClass:'bg-white',
              containerCloseButton:true
            }
          })

          loginModal.subscribe( ({type}) => {
            if(type == 'open:rendered'){
              // replace the return value with current page
              const forms = loginModal.wrapper.querySelectorAll('form')
              forms.forEach(form => {
                const returnToInput = form.querySelector('[name="return_to"]')
                if(returnToInput){
                  returnToInput.value = `${window.location.pathname}${window.location.search}`
                }else{
                  form.insertAdjacentHTML(
                    'afterbegin',
                    `<input type="hidden" name="return_to" value="${window.location.pathname}${window.location.search}"/>`
                  )
                }
              })
              // password reset toggle
              let showRecover = false
              const defaultForm = loginModal.wrapper.querySelector('#CustomerLoginForm') 
              const recoverPasswordForm = loginModal.wrapper.querySelector('#RecoverPasswordForm') 
              loginModal.wrapper.querySelectorAll('.js-password-reset-toggle').forEach(elem => elem.addEventListener('click',(e) => {
                e.preventDefault()
                showRecover = !showRecover
                defaultForm.style.display = showRecover ? 'none' : 'block'
                recoverPasswordForm.style.display = !showRecover ? 'none' : 'block'
              }))
              // mobile toggles
              const tabs = loginModal.wrapper.querySelectorAll('[data-tab]')
              const loginForm = loginModal.wrapper.querySelector('.js-login-form')
              const registerForm = loginModal.wrapper.querySelector('.js-register-form')
              tabs.forEach(elem => elem.addEventListener('click',(e) => {
                e.preventDefault()
                const {tab} = elem.dataset
                loginForm.style.display = tab == 'login' ? 'block' : 'none'
                registerForm.style.display = tab == 'register' ? 'block' : 'none'
                tabs.forEach( item => {
                  item.classList.toggle('selected',item == elem)
                })
              }))
            }
          })
          resolve()
        })
        .catch(err => {
          reject()
        })
      }).catch(err => {
        window.location.href = '/account'
        return
      })
    }
    loginModal.open()
    
  }))
}).catch(err =>  console.log(err))

export{
  DomReadyPromise
}

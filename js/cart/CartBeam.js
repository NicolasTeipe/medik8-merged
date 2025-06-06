// deps [parseHTML,ObserverLite,DomReadyPromise] loaded globally

export class CartBeam extends HTMLElement{
  constructor() {
    super();
  }

  connectedCallback() {

    DomReadyPromise().then( async () => {
      setTimeout(() => {            
        const cartElement = document.querySelector('beam-select-nonprofit')?.shadowRoot;
        if (cartElement) {
          const blockPromoEle = cartElement.querySelector('.block-header-promo-pill-container');
          const headerInlineEle = cartElement.querySelector('.header-inline');

          if (headerInlineEle) headerInlineEle.style.textAlign = 'center';
        }
      }, 200);
    }).catch(err => {
      console.log(err)
    })
  }

}

customElements.define('cart-beam', CartBeam);

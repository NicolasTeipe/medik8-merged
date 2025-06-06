// deps { ObserverLite , parseHTML , GlobalCart } loaded globally
export class RoswellSampler extends HTMLElement {

  constructor() {
    super();
  }

  connectedCallback() {
    DomReadyPromise().then( async () => {
      const settingsTemplete = this.querySelector(':scope > template')
      if(settingsTemplete){
        try{
          this.settings = JSON.parse(settingsTemplete.innerHTML)
          settingsTemplete.remove()
        }
        catch(err){
          console.log(err)
        }
      }
      if(!this.settings){
        this.remove()
      }
      this.GlobalCart = await new GlobalCart()
      this.bind()
      this.mount()
      this.onCartUpdate()
    }).catch(err => {
      console.log(err)
    })
  }

  bind(){
    // Expand/collapse sample container
    this.querySelector('.sample-selector-title').addEventListener("click",(event) => {
      let sibling = event.target.nextElementSibling;
      sibling.classList.toggle("hidden");
      let parent = event.target.parentElement;
      parent.classList.toggle("accordion-item--open");
    })

    // remove from cart button
    this.querySelectorAll('.js-roswell__removeFromCart').forEach(
      element => element.addEventListener('click',(e) => {
        e.preventDefault
        const {id} = element.dataset
        this.GlobalCart.updateQty(false,false,[
          {key:id,qty:0}
        ])
      })
    )
    // subsribe to cart and update UI
    this.GlobalCart.subscribe( ({eventType}) => {
      if(!eventType == 'update'){
        return
      }
      this.onCartUpdate()
    })
  }

  onCartUpdate(){
    const {cart} = this.GlobalCart
    const threshold = this.settings.threshold
    const sampleQuantity = cart.items.reduce((count, {properties}) => properties._RoswellSample ? ++count : count, 0),
    sampleProducts = this.querySelectorAll(".sample-product"),
    sampleLimit = this.settings.max_sample

    if(cart.total_price >= threshold) {
      this.style.display = "block";
    } else {
      this.style.display = "none";
      this.removeAllSample();
    }

    this.toggleSample(sampleProducts, sampleQuantity, sampleLimit);
    this.updateSampleQuantity(sampleQuantity, sampleLimit);
    this.updateSampleButton(sampleProducts, cart.items);
  }

  toggleSample(sampleProducts, sampleQuantity, sampleLimit) {
    if(sampleQuantity >= sampleLimit) {
      // Disable all samples
      sampleProducts.forEach((element) => {
        element.querySelector(".btn--full").classList.add("disabled");
      });
    } else {
      // Enable all samples
      sampleProducts.forEach((element) => {
        element.querySelector(".btn--full").classList.remove("disabled");
      });
    }
  }

  updateSampleQuantity(sampleQuantity, sampleLimit) {
    // Update number of sample to select
    let sampleRemains = this.querySelectorAll(".sample-remain");
    if(sampleRemains.length > 0) {
      let remainText = "Select ";
      let remainQty = sampleLimit - sampleQuantity;
      remainText += remainQty;
      remainText += " more Free Sample";
      if(remainQty > 1) {
        remainText += "s"
      }
      if(remainQty > 0) {
        sampleRemains.forEach(sampleRemain => sampleRemain.innerHTML = remainText)
      } else {
        sampleRemains.forEach(sampleRemain => sampleRemain.innerHTML = "")
      }
    }
  }

  updateSampleButton(sampleProducts) {

    const cartItems = this.GlobalCart.cart.items
    // Show all samples
    sampleProducts.forEach((element) => {
      element.querySelector(".btn--full")?.classList.remove("hide");
    });
    // Hide all remove
    sampleProducts.forEach((element) => {
      element.querySelector(".ajaxcart__qty--remove")?.classList.add("hide");
    });

    sampleProducts = Array.from(sampleProducts)
    const samplesInCart = cartItems.filter( ({properties}) => properties._RoswellSample)
    samplesInCart.forEach((sample) => {
      let foundSample = sampleProducts.filter(x => x.dataset.id == sample.key.split(":")[0]);
      if(foundSample.length) {
        foundSample.forEach(function(targetSample, index) {
          targetSample.querySelector(".btn--full").classList.add("hide");
          let remove = targetSample.querySelector(".ajaxcart__qty--remove");
          remove.classList.remove("hide");
          remove.dataset.line = index + 1;
          remove.dataset.id = sample.key;
        });
      }
    });
  }

  removeAllSample() {
    const cartItems = this.GlobalCart.cart.items
    const samplesInCart = cartItems.filter( ({properties}) => properties._RoswellSample)
    if(samplesInCart.length){
      const updateData = samplesInCart.map( ({key}) => {
        return {key,qty:0}
      })
      this.GlobalCart.updateQty(false,false,updateData)
    }
  }
  
  mount(){
    if(!window.RoswellSamplerMounted){
      const style = `
        <style type="text/css">

          .cart .sample-selector {
            max-width: 674px; 
          }

          @media all and (max-width: 1024px) {
            .cart .sample-selector {
              max-width: 100%; 
            } 
          }

          .sample-selector {
            padding: 0 20px;
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 100%), #FFF; 
          }

          .sample-selector .sample-selector-title {
            font-family: "acta_displaymedium", sans-serif;
            font-size: 16px;
            font-weight: 500;
            line-height: 120%;
            letter-spacing: 0.8px;
            padding-top: 20px;
            padding-bottom: 20px;
            justify-content: space-between;
            display: flex;
            cursor: pointer; 
          }

          .sample-selector .sample-selector-title::after {
            content: url("data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='8' viewBox='0 0 13 8' fill='none'%3E%3Cpath d='M12.0214 7.0179L12.0277 7.01162L12.033 7.00452C12.0841 6.93637 12.125 6.84797 12.125 6.75048C12.125 6.66544 12.0935 6.5631 12.0149 6.4902L6.43632 0.911612L6.34794 0.823223L6.25955 0.911612L0.679117 6.49204C0.536323 6.63484 0.536323 6.87061 0.679117 7.0134C0.821911 7.1562 1.05768 7.1562 1.20048 7.0134L6.34802 1.86587L11.5001 7.0179C11.6428 7.1607 11.8786 7.1607 12.0214 7.0179Z' fill='black' stroke='black' stroke-width='0.25'/%3E%3C/svg%3E");
            transform: rotateX(180deg); 
          }

          .sample-selector.accordion-item--open .sample-selector-title {
            padding-bottom: 0px; 
          }

          .sample-selector.accordion-item--open .sample-selector-title::after {
            transform: none; 
          }

          .sample-selector .sample-remain {
            color: #C79A94;
            font-size: 14px;
            font-weight: 390;
            line-height: 150%;
            flex: 0 0 100%;
            padding-bottom: 20px; 
          }

          .sample-selector .sample-selector-container {
            flex: 1;
            display: flex;
            overflow-x: auto;
            overflow-y: hidden;
            transition: max-height 0.3s ease-out;
            flex-wrap: wrap;
            max-height: 1000px; 
          }
          .sample-selector .sample-selector-container.hidden {
            max-height: 0; 
          }
          .sample-selector .sample-selector-container .sample-selector-inner-container {
            display: flex;
            justify-content: space-between; 
          }
          
          .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product {
            width: 160px;
            margin-right: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between; 
          }
          
          @media all and (max-width: 767px) {
            .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product {
              width: 140px; 
            } 
          }
          
          .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product:last-child {
            margin-right: 0; 
          }
          
          .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product .sample-title {
            font-size: 14px;
            font-weight: 420;
            line-height: 150%; 
          }
                
          .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product .sample-size {
            color: #666;
            font-size: 10px;
            font-weight: 390;
            line-height: 150%; 
          }
            
          .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product .btn--full, .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product .ajaxcart__qty--remove {
            background: #000;
            color: #fff;
            width: 100%;
            border-radius: 0.25rem;
            min-height: 3em;
            line-height: 1.42;
            font-size: 14px; 
          }
          
          .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product .btn--full:hover, .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product .ajaxcart__qty--remove:hover {
            background: transparent;
            color: #000 !important; 
          }
          
          .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product .btn--full.disabled, .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product .ajaxcart__qty--remove.disabled {
            color: #666666;
            background: #A4ACB1;
            pointer-events: none;
            border-color: #A4ACB1; 
          }
          
          .sample-selector .sample-selector-container .sample-selector-inner-container .sample-product a.btn--full {
            display: flex;
            justify-content: center;
            align-items: center; 
          }
        
        </style>
      `
      window.RoswellSamplerMounted = true
      document.body.append(parseHTML(style))
    }
  }




}
customElements.define('roswell-sampler', RoswellSampler);

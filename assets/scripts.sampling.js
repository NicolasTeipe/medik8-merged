export class GlobalSampleThumb extends HTMLElement {
  constructor() {
    super();
    this.showAtc = true;
  }

  connectedCallback() {
    if (this.mounted) {
      return;
    }
    DomReadyPromise().then(async () => {
      this.cart = await new GlobalCart();
      let settings = this.querySelector(':scope > template');
      if (settings) {
        try {
          this.settings = JSON.parse(settings.innerHTML);
        } catch (err) {
          console.log(err);
        }
        settings.remove();
      }
      this.mount();
    });
  }

  getParams() {
    const params = new URLSearchParams(window.location.search);
    let paramsObj = {};
    for (let [key, value] of params.entries()) {
      paramsObj[key] = value;
    }
    return paramsObj;
  }

  getSessionParams() {
    if (!this.settings?.session_key) {
      return;
    }
    let data = window.sessionStorage.getItem(this.settings.session_key);
    return data && data.length ? JSON.parse(data) : {};
  }

  setSessionParams(data) {
    if (!this.settings?.session_key || !data) {
      return;
    }
    window.sessionStorage.setItem(
      this.settings.session_key,
      JSON.stringify(data)
    );
  }

  toggleAtcButton({remove,disabled} = {}) {
    if (remove) {
      this.button?.remove();
      delete this.button;
      return;
    }

    if (!this.button) {
      const buttonHTML = `
          <button class="btn--full btn--outline" onClick="GlobalCartMain.addProductFromButton(event)">
            <span class="text">${this.settings.translations.add_to_bag}</span>
          </button>
        `;
      this.variantIdInput.insertAdjacentHTML('afterend', buttonHTML);
      this.button = this.querySelector('button');
    }

    if(disabled){
      this.button.disabled = true
    }
  }

  toggleItemInCartMessage(remove, type) {
    this.inCartMessage?.remove();
    delete this.inCartMessage;

    if (remove) {
      return;
    }

    const inCartMessageHTML =
      type == 'variantInCart'
        ? `<button class="js-inCartMessage btn--feedback btn--feedback__add">${this.settings.translations.sample_in_bag}</button>`
        : `<button class="js-inCartMessage btn--feedback btn--feedback__max fade-out">${this.settings.translations.max_samples_in_bag}</button>`;
    this.variantIdInput.insertAdjacentHTML('afterend', inCartMessageHTML);
    this.inCartMessage = this.querySelector('.js-inCartMessage');
    this.inCartMessage.addEventListener('click', e => {
      e.preventDefault();
      window.globalSideBarUI__cart.open();
    });
  }

  updateButtonState() {

    const variantInCart = this.cart.getLineItemsByVariantId(
      this.variantIdInput.value
    );

    if (this.disableAtc) {
      this.toggleAtcButton({disabled:true});
      this.toggleItemInCartMessage(true);
    } else if (variantInCart.length) {
      this.toggleAtcButton({remove:true});
      this.toggleItemInCartMessage(false, 'variantInCart');
    } else {
      // get other items from cart with validation property NB, we could do this at a cart level rather than mapping for each instance
      const itemsInCartWidthValidationProperty = 
        this.cart.getLineItemsByProperty('_upsell_validation')
        .map( item => {
          item.validation = item.properties._upsell_validation ? JSON.parse(item.properties._upsell_validation) : false
          return item
        })

      const itemsInCartWithSampleUseGlobalMax = itemsInCartWidthValidationProperty.filter( ({validation}) => validation.samples_use_global_max)
      const showMaxSamplesMessage = 
        this.settings.validation.samples_use_global_max ? 
        ( 
          itemsInCartWithSampleUseGlobalMax.length >= 3 ||
          this.settings.validation.max_items && itemsInCartWidthValidationProperty.filter(
            (item) => item.validation.offer_id == this.settings.validation.offer_id
          ).length >= this.settings.validation.max_items
        ) : false
      if (showMaxSamplesMessage) {
        this.toggleAtcButton({remove:true});
        this.toggleItemInCartMessage(false, 'maxSamples');
      } else {
        this.toggleAtcButton();
        this.toggleItemInCartMessage(true);
      }
    }

    this.updateSampleImageOpacity();
  }

  /**
   * Adjusts the height of all elements matching the provided selector to be
   * equal to the height of the tallest element.
   * @param {string} selector - The CSS selector used to select the elements.
   */
  adjustHeights(selector) {
    // TODO - currently runs n times where n = num product, only needs to run once
    const elements = document.querySelectorAll(selector);
    elements.forEach(e => (e.style.height = `auto`));
    const currentMaxHeight = Array.from(elements).reduce(
      (maxHeight, e) => Math.max(maxHeight, e.offsetHeight),
      0
    );
    elements.forEach(e => (e.style.height = `${currentMaxHeight}px`));
  }

  updateSampleImageOpacity() {
    const atcButton = this.querySelector('button');
    !atcButton || atcButton.classList.contains('fade-out')
      ? this.querySelector('img').classList.add('opacity-layer')
      : this.querySelector('img').classList.remove('opacity-layer');
  }

  async mount() {
    this.mounted = true;
    
    this.updateSampleImageOpacity();

    this.adjustHeights('.sample-product__title');
    this.adjustHeights('.sample-product__desc');
    window.addEventListener('resize',() => {
      this.adjustHeights('.sample-product__title');
      this.adjustHeights('.sample-product__desc');
    })

    // customer visibility / button state logic
    const { section_settings, validation } = this.settings || false
    const {customer } = validation
    
    this.disableAtc = customer?.required ? (
      (customer.required?.new_customer_only && (!customer.current?.id || customer.current.orders_count > 0)) ||
      (customer.required?.existing_customer_only && (
        !customer.current?.id || customer.current.orders_count <= 1 
      ))
    ) : false
    
    // sesssion param visibility
    if (section_settings && section_settings.params_use && !this.disableAtc) {
      let { params_key, params_values } = section_settings;
      params_values = params_values.split(',');
      const params = { ...this.getParams(), ...this.getSessionParams() };
      this.setSessionParams(params);
      this.disableAtc = params[params_key] && params_values.indexOf(params[params_key]) >= 0 ? false : true;
    }

    this.variantIdInput = this.querySelector('[name="id"]')
    this.validationStringInput = this.querySelector('[name="properties[_upsell_validation]"]')
    this.validationStringInput.value = JSON.stringify(validation)

    this.updateButtonState();

    this.cart.subscribe(({ eventType }) => {
      if (eventType == 'update') {
        this.updateButtonState();
      }
    });
  }
}

// customElements.define('global-sample-thumb', GlobalSampleThumb);
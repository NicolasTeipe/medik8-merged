// Taken from Dawn theme - 'assets/global.js'

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
    this.ObserverLite = this.ObserverLite || new ObserverLite() 
  }


  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(){
    this.ObserverLite.next()
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.updateInventoryQty();
    //this.toggleAddButton(true, '', false);
    this.updatePickupAvailability();
    this.removeErrorMessage();
    this.updateVariantStatuses();

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.updateSubscriptions();
      this.renderProductInfo();
      this.updateShareUrl();
      this.next()
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  // Update form inventory qty so it can be passed as a line_item prop
  updateInventoryQty() {
    const form = document.querySelector('.js-product-form-wrapper form');
    const variantInventoryQty = form
      .querySelector(`option[value='${this.currentVariant.id}']`)
      ?.getAttribute('data-option-inventory-qty');
    if (variantInventoryQty) {
      const quantityInput = form.querySelector('input[name="quantity"]');
      quantityInput?.setAttribute(
        'data-variant-inventory-qty',
        variantInventoryQty
      );
    }
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGalleries = document.querySelectorAll(`[id^="MediaGallery-${this.dataset.section}"]`);
    mediaGalleries.forEach((mediaGallery) =>
      this.setActiveMedia(`${this.currentVariant.featured_media.id}`)
    );

    const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product-media-modal__content`);
    if (!modalContent) return;
    const newMediaModal = modalContent.querySelector(`[data-media-id="${this.currentVariant.featured_media.id}"]`);
    modalContent.prepend(newMediaModal);
  }

  setActiveMedia(mediaId) {

    const productGalleryContainer = document.querySelector('main .product-gallery-container');

    const prevActiveSlide = productGalleryContainer.querySelector('.product-image-carousel__slide.active-slide');
    const newActiveSlide = productGalleryContainer.querySelector(`[data-variant-media-id="${ mediaId }"]`);
    
    if(!prevActiveSlide || !newActiveSlide) return;

    prevActiveSlide.classList.remove('active-slide');
    newActiveSlide.classList.add('active-slide');

  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateShareUrl() {
    const shareButton = document.getElementById(`Share-${this.dataset.section}`);
    if (!shareButton || !shareButton.updateUrl) return;
    shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #AddToCartForm, #product-form-installment-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(':checked').value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
        .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.innerText = input.getAttribute('value');
      } else {
        input.innerText = window.variantStrings.unavailable_with_option.replace('[value]', input.getAttribute('value'));
      }
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    if (section.querySelector('.errors.qty-error')) {
      section.querySelector('.errors.qty-error').remove();
    }
    // Dawn connection to product-form element
    // const productForm = section.querySelector('product-form');
    // if (productForm) productForm.handleErrorMessage();
  }

  async renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection
      ? this.dataset.originalSection
      : this.dataset.section;
  
    const url =  `${this.dataset.url}?variant=${requestedVariantId}&section_id=${
      this.dataset.originalSection
        ? this.dataset.originalSection
        : this.dataset.section
    }`

    const response = await fetch(
     url
    );
    const responseText = await response.text();
  
    // prevent unnecessary ui changes from abandoned selections
    if (this.currentVariant.id !== requestedVariantId) return;
  
    const html = new DOMParser().parseFromString(responseText, 'text/html');
    const destination = document.getElementById(`price-${this.dataset.section}`);
    const source = html.getElementById(
      `price-${
        this.dataset.originalSection
          ? this.dataset.originalSection
          : this.dataset.section
      }`
    );
    const skuSource = html.getElementById(
      `Sku-${
        this.dataset.originalSection
          ? this.dataset.originalSection
          : this.dataset.section
      }`
    );
    const skuDestination = document.getElementById(`Sku-${this.dataset.section}`);
    const inventorySource = html.getElementById(
      `Inventory-${
        this.dataset.originalSection
          ? this.dataset.originalSection
          : this.dataset.section
      }`
    );
  
    const oosPopover = document.getElementById('OutOfStockPopover');
    const oosPopoverSource = html.getElementById('OutOfStockPopover');
  
    const inventoryDestination = document.getElementById(
      `Inventory-${this.dataset.section}`
    );
  
    if (source && destination) destination.innerHTML = source.innerHTML;
    if (inventorySource && inventoryDestination)
      inventoryDestination.innerHTML = inventorySource.innerHTML;
    if (skuSource && skuDestination) {
      skuDestination.innerHTML = skuSource.innerHTML;
      skuDestination.classList.toggle(
        'visibility-hidden',
        skuSource.classList.contains('visibility-hidden')
      );
    }
    if (oosPopover && oosPopoverSource)
      oosPopover.replaceWith(oosPopoverSource.cloneNode(true))
  
    const price = document.getElementById(`price-${this.dataset.section}`);
    if (price) price.classList.remove('visibility-hidden');

    const addToCartTextSource = html.getElementById('AddToCartText')
    const addToCartTextDestination = document.getElementById('AddToCartText')
    if (addToCartTextSource && addToCartTextDestination)
      addToCartTextDestination.innerHTML = addToCartTextSource.innerHTML;

    const labelSource = html.querySelector('.f-product-hero__details .label-wrapper')
    const labelDestination = document.querySelector(
      '.f-product-hero__details .label-wrapper'
    );
    if (labelSource && labelDestination) {
      const clonedNode = labelSource.cloneNode(true);
      labelDestination.replaceWith(clonedNode);
    }
  
    if (inventoryDestination)
      inventoryDestination.classList.toggle(
        'visibility-hidden',
        inventorySource.innerText === ''
      );
  
    const addButtonUpdated = html.querySelector(
      `.ProductSubmitButton-${sectionId}`
    );

    this.toggleAddButton(
      addButtonUpdated ? addButtonUpdated.classList.contains('hide') : true,
      window.variantStrings.soldOut
    );
  
    publish(PUB_SUB_EVENTS.variantChange, {
      data: {
        sectionId,
        html,
        variant: this.currentVariant,
      },
    });
  
    await Promise.all([
      sitewide && sitewide.updatePriceV2(String(requestedVariantId)),
      sitewide && sitewide.updateLabelV2(String(requestedVariantId)),
    ]);
  
    // if subs are active, price box to contain price of correct subs option (onetime / subsave)
    if (window.rechargeWidgetLoaded) {
      const pricePre = document.querySelector(
        '.rc_container_wrapper .rc-option--active s.rc_widget__price'
      ).textContent;
      const priceAct = document.querySelector(
        '.rc_container_wrapper .rc-option--active span.rc_widget__price'
      ).textContent;
  
      const priceBox = document.querySelector('#AddToCart');
      priceBox.querySelector('s.price-v2__pre-pdp') &&
        (priceBox.querySelector('s.price-v2__pre-pdp').textContent = pricePre);
      priceBox.querySelector('span.price-v2__actual-pdp').textContent = priceAct;
    }
  
    // Update LL points
    const priceActual = document.querySelector(
      '#AddToCart .price-v2__actual-pdp'
    )?.textContent || false;
    const loyaltyHint = document.querySelector('.js-loyalty-hint__price');
    const loyaltyHintParent = loyaltyHint?.closest('product-loyalty-points-hint-v2') || false
    if(!priceActual && loyaltyHint){
      loyaltyHintParent.style.display = 'none'
      return
    }
    if (loyaltyHint) loyaltyHint.innerHTML = priceActual;
    loyaltyHintParent.style.display = 'flex'
    window.loyaltylion.ui && window.loyaltylion.ui.refresh();
  }
  

  toggleAddButton(disable, text, modifyClass) {
    const productForm = document.querySelector(`.product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    const oosButton = productForm.querySelector('.js-out-of-stock-trigger ')
    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      addButton.classList.add('hide')
      oosButton.classList.remove('hide')
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButton.classList.remove('hide')
      oosButton.classList.add('hide')
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    const inventory = document.getElementById(`Inventory-${this.dataset.section}`);
    const sku = document.getElementById(`Sku-${this.dataset.section}`);

    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('visibility-hidden');
    if (inventory) inventory.classList.add('visibility-hidden');
    if (sku) sku.classList.add('visibility-hidden');
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }

  updateSubscriptions() {
    // update compare-at pricing
    const variantCompare = document
      .querySelector(`#AddToCartForm option[value="${this.currentVariant.id}"]`)
      .getAttribute('data-compare');
  
    const comparesToUpdate = document.querySelectorAll(
      's.rc_widget__price.compare-at--onetime, s.rc_widget__price.compare-at--subsave'
    );
  
    comparesToUpdate.forEach(c => {
      c.textContent = c.getAttribute('update') === 'true' ? variantCompare : '';
    });
  
    // update sitewide pricing
    sitewide &&
      sitewide.updateSubscriptionPricing(String(this.currentVariant.id));
  }
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.classList.remove('disabled');
      } else {
        input.classList.add('disabled');
      }
    });
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      const checkedRadio = Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked);
      fieldset.querySelectorAll('.variant_label').forEach(variant => {
        variant.classList.remove('selected')
      })
      checkedRadio.closest('.variant_label').classList.add('selected');
      return checkedRadio.value;
    });
  }
}

customElements.define('variant-radios', VariantRadios);

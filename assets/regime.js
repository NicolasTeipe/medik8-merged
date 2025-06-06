(() => {
  // Tabs
  (function regimeTabsInit() {
    var groupElements = document.querySelectorAll('[data-regime-tab-group]');

    var buttonAttribute = 'data-regime-tab-button';

    var panelAttribute = 'data-regime-tab-panel';

    var isActiveClass = 'is-active';

    groupElements.forEach(groupElement => {
      var buttonElements = groupElement.querySelectorAll(
        `[${buttonAttribute}]`
      );

      var panelElements = groupElement.querySelectorAll(`[${panelAttribute}]`);

      groupElement.addEventListener('click', event => {
        if (!event.target.matches(`[${buttonAttribute}]`)) return;

        var buttonElement = event.target;

        var buttonId = buttonElement.getAttribute(buttonAttribute);

        var activePanelElements = groupElement.querySelectorAll(
          `[${panelAttribute}='${buttonId}']`
        );

        [...buttonElements, ...panelElements].forEach(buttonOrPanelElement => {
          buttonOrPanelElement.classList.remove(isActiveClass);

          if (buttonOrPanelElement.ariaSelected) {
            buttonOrPanelElement.ariaSelected = 'false';
          }

          if (buttonOrPanelElement.ariaHidden) {
            buttonOrPanelElement.ariaHidden = 'true';
          }
        });

        if (activePanelElements.length) {
          activePanelElements.forEach(activePanelElement => {
            activePanelElement.classList.add(isActiveClass);
            activePanelElement.ariaHidden = 'false';
          });
        }

        buttonElement.classList.add(isActiveClass);
        buttonElement.ariaSelected = 'true';
      });
    });
  })();

  // Menu select

  (function regimeMenuSelectInit() {
    var selectElement = document.querySelector('styled-select');
    if (selectElement) {
      selectElement.addEventListener('change', () => {
        var select = selectElement.querySelector('select');
        location = select.value;
      });
    }
  })();

  // Product form

  (function regimeProductFormInit() {
    var containerAttribute = 'data-regime-product-form-container';

    var containerElements = document.querySelectorAll(
      `[${containerAttribute}]`
    );

    containerElements.forEach(containerElement => {
      var containerData = JSON.parse(
        containerElement.getAttribute(containerAttribute)
      );

      var formElement = containerElement.querySelector(
        '[data-regime-product-form]'
      );

      var priceElement = containerElement.querySelector(
        '[data-regime-product-form-price]'
      );

      var imageElement = containerElement.querySelector(
        '[data-regime-product-form-image]'
      );

      var quickviewAttribute = 'data-regime-product-form-quickview';

      var quickviewProductAttribute = 'data-product';

      var quickviewElement = containerElement.querySelector(
        `[${quickviewAttribute}]`
      );

      let reChargeWidget = false;

      window.addEventListener('ReChargeWidget-loaded', () => {
        const reChargeWidgetConfig = {
          productId: containerData.product.id,
          injectionParent: `[data-regime-product-form-recharge][data-form-id="${containerData.formId}"]`,
          selectors: {
            variant: ['.regime-product-card__select'],
          },
        };

        reChargeWidget =
          window.ReChargeWidget.createWidget(reChargeWidgetConfig);

        let count = 0;
        const checkWidgetRendered = setInterval(() => {
          count++;
          if (reChargeWidget.isRendered) {
            clearInterval(checkWidgetRendered);

            containerElement
              .querySelector('[data-regime-product-form-price]')
              .classList.add('hide');

            const rechargeContainer = document.querySelector(
              `[data-form-id=${containerData.formId}]`
            );

            insertRechargeCompareSpan(rechargeContainer, 'onetime');
            insertRechargeCompareSpan(rechargeContainer, 'subsave');

            const variantId = rechargeContainer
              .closest('form')
              .querySelector('select').value;

            sitewide &&
              sitewide.updateRegimeSubscriptionPricing(
                variantId,
                rechargeContainer
              );

            // listen for and react to recharge widget option change
            const rcWidgetOptions =
              rechargeContainer.querySelectorAll('.rc-option');

            rcWidgetOptions.forEach(option => {
              option.addEventListener(
                'click',
                e =>
                  e.target.value &&
                  updateAtcPriceBoxFromSubs(
                    e,
                    rechargeContainer.closest('form')
                  )
              );
            });
          }

          // prevent interval repeating forever
          if (count === 40) {
            clearInterval(checkWidgetRendered);
            console.error('The recharge widget did not render in time');
          }
        }, 100);
      });

      formElement.addEventListener('change', () => {
        // Get selected selling plan from active recharche dropdown and update data atribute on form element!

        if (
          formElement.querySelector(
            '.rc_widget__option--subsave.rc-option--active'
          )
        ) {
          formElement.setAttribute(
            'data-selling-plan',
            formElement.querySelector('.rc-selling-plans__dropdown').value
          );
        } else {
          formElement.removeAttribute('data-selling-plan');
        }

        var variant = containerData.product.variants.find(
          variant => variant.id == formElement.id.value
        );

        if (!variant) return;

        // update variant.id on button to ensure correct variant is added via 'add all to bag'
        formElement
          .querySelector('.regime-product-card__submit')
          .setAttribute('data-variant-id', variant.id);

        // add / upd compare-at price in ATC element
        priceElement.querySelector('s')?.remove();
        if (variant.compare_at_price) {
          const prePriceElement = document.createElement('s');
          prePriceElement.className = 'price-v2-pdp price-v2__pre-pdp';
          prePriceElement.setAttribute('aria-hidden', 'true');
          prePriceElement.setAttribute('compare-at', variant.compare_at_price);
          prePriceElement.textContent = formatPrice(
            containerData.currencySymbol,
            variant.compare_at_price
          );

          priceElement.insertBefore(prePriceElement, priceElement.firstChild);
        }

        priceElement.querySelector('span').textContent = formatPrice(
          containerData.currencySymbol,
          variant.price
        );

        if (reChargeWidget) {
          reChargeWidget.state.selectedVariantId = variant.id;
          reChargeWidget.store.dispatch(
            'setSelectedVariantId',
            reChargeWidget.state.selectedVariantId
          );
          reChargeWidget.syncVariant();

          // apply compare-at only to onetime box. Adding a compare-at to subs box 
          // will confuse, as unclear what this figure represents - is it compare, non sub price, etc?
          formElement.querySelector('s.compare-at--onetime').textContent =
            variant.compare_at_price
              ? formatPrice(containerData.currencySymbol, variant.compare_at_price)
              : '';
        }

        if (sitewide) {
          const priceV2Span = formElement.querySelector(
            'span.price-v2__actual-pdp'
          );
          updateVariantData(variant.id, priceV2Span);

          sitewide.updateRegimePriceV2(String(variant.id), priceV2Span);
          sitewide.updateRegimeSubscriptionPricing(
            String(variant.id),
            formElement
          );
        }

        if (imageElement && variant.featured_image?.src) {
          imageElement.src = imageElement.srcset = variant.featured_image.src;
        }

        if (quickviewElement) {
          var quickviewValue = `${
            quickviewElement
              .getAttribute(quickviewProductAttribute)
              .split('?')[0]
          }?variant=${variant.id}`;

          quickviewElement.setAttribute(
            quickviewProductAttribute,
            quickviewValue
          );
        }
      });
    });

    function formatPrice(currencySymbol, priceData) {
      if (!priceData) return null;

      let priceFloat = priceData / 100;

      let price = Number.isInteger(priceFloat)
        ? `${currencySymbol}${priceFloat}`
        : Shopify.formatMoney(priceData, `${currencySymbol}{{ amount }}`);

      return price;
    }

    // On variant change, update the priceV2 span with current variant info
    // Only required when sitewide is active
    function updateVariantData(variantId, priceV2Span) {
      // rm existing 'price-v2__<variantId>` class
      const classToRemove = [...priceV2Span.classList].find(
        className =>
          className.startsWith('price-v2__') &&
          /^\d+$/.test(className.slice(10))
      );
      if (classToRemove) priceV2Span.classList.remove(classToRemove);

      priceV2Span.classList.add(`price-v2__${variantId}`);
    }
  })();
})();

class regimeToolbar extends HTMLElement {
  constructor() {
    super();
    this.regimeTabs = document.querySelector('[data-regime-tab-group]');
    this.cartButton = document.querySelector('.js-cart-toggle');
    this.submitButton = this.querySelector('[js-submit]');
    this.submitButton.addEventListener('click', () => this.handleSubmit());
  }

  async handleSubmit() {
    const activeTabs = [
      ...this.regimeTabs.querySelectorAll('.regime-product-cards.is-active'),
    ];
    const submitButtons = activeTabs.flatMap(tabGroup => [
      ...tabGroup.querySelectorAll(
        '.regime-product-cards.is-active [data-regime-product-form-submit]'
      ),
    ]);

    this.submitButton.classList.add('btn--loading');

    let formData = {
      items: [],
    };

    for (const button of submitButtons) {
      let sellingPlan;
      if (button.form.getAttribute('data-selling-plan')) {
        sellingPlan = button.form.getAttribute('data-selling-plan');
      } else {
        sellingPlan = '';
      }
      let newItem = {
        id: button.getAttribute('data-variant-id'),
        quantity: 1,
        selling_plan: sellingPlan,
      };
      formData.items.push(newItem);
    }

    const globalCart = await new GlobalCart();
    globalCart
      .addToCart(formData, false)
      .then(response => {
        window.globalSideBarUI__cart.open();
        this.submitButton.classList.remove('btn--loading');
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
}
window.customElements.define('regime-toolbar', regimeToolbar);

// Fixes issue with duplicate ReCharge forms
window.addEventListener('load', () => {
  setTimeout(() => {
    const rechargeFormLabels = document.querySelectorAll('.rc-radio__label');
    rechargeFormLabels.forEach(label => {
      label.addEventListener('click', event => {
        event.preventDefault();
        const labelInput =
          event.currentTarget.parentNode.querySelector('input');
        labelInput.click();
      });
    });
  }, 1500);
});

// Fixes issue with sywm not removing swym-added class as it should
class swymButton extends HTMLElement {
  constructor() {
    super();
    // Fixes issue with swym adding added class to multiple wishlist buttons
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          this.classList.toggle(
            'swym-added-on-load',
            this.classList.contains('swym-added')
          );
          if (this.classList.contains('swym-loaded')) observer.disconnect();
        }
      });
    });
    observer.observe(this, { attributes: true });

    this.addEventListener('click', this.clickHandler.bind(this));
  }

  clickHandler() {
    const classCondition =
      this.classList.contains('swym-adding') &&
      !this.classList.contains('swym-removed');
    this.classList.toggle('swym-removed', classCondition);
    this.classList.remove('swym-added-on-load');
  }
}
window.customElements.define('swym-button', swymButton);

// Select boxes into drop downs
class StyledSelect extends HTMLElement {
  constructor() {
    super();
    this.select = this.querySelector('select');
    this.select.style.display = 'none';
    this.renderDropdown();
  }

  renderDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.classList.add('styled-select-menu');
    this.dropdown.setAttribute('aria-labelledby', 'styled-dropdown-button');

    const contentContainer = document.createElement('div');
    contentContainer.classList.add('styled-select-menu__content');

    if ([...this.select.children].some(child => child.tagName === 'OPTGROUP')) {
      [...this.select.children].forEach(option => {
        if (option.tagName === 'OPTGROUP') {
          const group = document.createElement('h3');
          group.textContent = option.label;
          contentContainer.appendChild(group);

          Array.from(option.children).forEach(opt => {
            const button = this.createButton(opt);
            contentContainer.appendChild(button);
          });
        }
      });
    } else {
      [...this.select.children].forEach(option => {
        if (option.tagName === 'OPTION') {
          const button = this.createButton(option);
          contentContainer.appendChild(button);
        }
      });
    }

    this.dropdown.appendChild(contentContainer);

    this.dropdownButton = document.createElement('button');
    this.dropdownButton.classList.add('styled-dropdown__toggle');
    this.dropdownButton.id = 'styled-dropdown-button';
    this.dropdownButton.ariaHasPopup = 'true';
    this.dropdownButton.ariaExpanded = 'false';
    this.selectedOption =
      this.select.options[this.select.selectedIndex].textContent;
    this.dropdownButton.textContent = this.selectedOption.trim();
    this.appendChild(this.dropdownButton);
    this.dropdownButton.addEventListener('click', () => this.toggleDropdown());

    this.appendChild(this.dropdown);

    document.addEventListener('click', event => {
      if (!this.dropdownButton.contains(event.target)) {
        this.dropdown.classList.remove('open');
        this.dropdownButton.ariaExpanded = 'false';
      }
    });
  }

  createButton(option) {
    const button = document.createElement('button');
    button.textContent = option.textContent;
    button.value = option.value;
    if (option.selected) button.classList.add('selected');
    button.addEventListener('click', () => {
      this.select.value = option.value;
      this.dispatchEvent(new Event('change'));
      this.selectedOption = option.textContent;
      this.dropdownButton.textContent = this.selectedOption.trim();
      this.toggleDropdown();
    });
    return button;
  }

  toggleDropdown() {
    this.dropdown.classList.toggle('open');

    if (
      this.dropdown.classList.contains('open') &&
      this.dropdown.querySelector('button')
    ) {
      this.dropdown.querySelector('button').focus();
    }

    if (this.dropdownButton.ariaExpanded == 'true') {
      this.dropdownButton.ariaExpanded = 'false';
    } else {
      this.dropdownButton.ariaExpanded = 'true';
    }
  }
}

/**
 * Builds and inserts a comparison price span element next to the price span within a given container.
 *
 * @param {HTMLElement} container - The container element where the price span is located.
 * @param {string} classSuffix - A suffix to distinguish different price span elements.
 */
function insertRechargeCompareSpan(container, classSuffix) {
  let priceSpan = container.querySelector(`.rc_widget__price--${classSuffix}`);
  priceSpan.style = 'margin-left: 10px';

  const compareSpan = document.createElement('s');
  compareSpan.className = `rc_widget__price compare-at--${classSuffix} f-w400`;
  priceSpan.parentNode.insertBefore(compareSpan, priceSpan);
}

/**
 * Updates the "Add to Cart" (ATB) price box with the pre-discount and actual prices
 * from the subscriptions widget based on the selected subscription type.
 * Whilst subs are active, this will never be visible, but it keeps everything in sync.
 *
 * @param {Event} event - The change event triggered by the subscription type input selection.
 * @param {Document|HTMLElement} [src] - The element to query from for price box elements.
 *
 */
function updateAtcPriceBoxFromSubs(event, src = document) {
  if (event.target.tagName !== 'INPUT') return;

  const subsType = event.target.value;
  const pricePre = event.target
    .closest('.rc-widget')
    .querySelector(`s.compare-at--${subsType}`).textContent;
  const priceActual = event.target
    .closest('.rc-widget')
    .querySelector(`span.rc_widget__price--${subsType}`).textContent;

  const priceBox = src.querySelector('.regime-product-card__submit');

  setTimeout(() => {
    priceBox.querySelector('s.price-v2__pre-pdp') &&
      (priceBox.querySelector('s.price-v2__pre-pdp').textContent = pricePre);
    priceBox.querySelector('span.price-v2__actual-pdp').textContent =
      priceActual;
  }, 0);
}

window.customElements.define('styled-select', StyledSelect);

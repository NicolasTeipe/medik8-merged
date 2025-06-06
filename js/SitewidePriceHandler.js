import { ShopifyUtils } from '../js/ShopifyUtils';

/**
 * Handles sitewide pricing adjustments based on active discounts.
 */
export class SitewidePriceHandler {
  /**
   * Initializes the SitewidePriceHandler with customer tags and sets up the tiered discount data.
   * @param {Array} customerTags - Tags associated with the customer.
   */
  constructor(customerTags) {
    if (!window.progressBarTieredDiscountsData?.metafields) return;

    const money_format = `${window.cartCurrencySymbol}{{amount_optional_decimals}}`;
    this.ShopifyUtils = new ShopifyUtils({
      money_format: money_format,
    });

    this.customerTags = customerTags ? customerTags : [];

    this.sitewideTierReady = this.setSitewideTier();
  }

  /**
   * Sets the sitewide tier based on active discounts, cart & customer data.
   * @returns {Promise<void>}
   */
  async setSitewideTier() {
    /*
    TODO: Subscribe to the cart for any changes.
    TODO: On change, can update sitewide data and then refresh prices across the page.
    TODO: Would only need run 'updatePriceV2' as <option>'s are calculated on event
    TODO: triggering, so would use newly updated sitewide data.
    */
    this.GlobalCart = await new GlobalCart();

    const activeDiscountCodesInCart =
      await this.GlobalCart.getAllDiscountCodes();

    const activeDiscount = this.#getActiveDiscount(
      window.progressBarTieredDiscountsData.metafields,
      activeDiscountCodesInCart
    );

    const activeTier =
      activeDiscount
        ? this.#getActiveTier(
            activeDiscount,
            this.GlobalCart.cart.original_total_price
          )
        : null;

    this.sitewideTier =
      activeTier && Number(activeTier.amount) > 0 ? activeTier : null;

    if (this.sitewideTier)
      this.sitewideTier.discountSubs = activeDiscount.discountSubs;

    this.discount = this.sitewideTier ? this.sitewideTier.amount / 100 : null;

    this.discountMethod = this.sitewideTier
      ? activeDiscount.globalDiscountApplication.method
      : null;

    const products = this.sitewideTier
      ? activeDiscount.globalDiscountApplication.products
      : null;
  
    this.allVariants = products
      ? Object.values(products)
          .flat()
          .map(v => v.split('/').pop())
      : [];
  }

  /**
   * Updates the price of a variant based on the sitewide tier discount.
   * @param {string} variant - The variant to update the price for.
   * @param {HTMLElement} src - The source html to update.
   * @param {Boolean} firstTime - If this is the first time this is being run on the element.
   * @returns {Promise<void>}
   */
  async updatePriceV2(variant, src = document, firstTime = false) {
    await this.sitewideTierReady;
    if (!this.sitewideTier || !this.#checkApplicableVariant(variant)) return;

    const variantPriceActuals = src.querySelectorAll(
      `span.price-v2__${variant}`
    );

    variantPriceActuals.forEach(v => {
      if (!firstTime || !v.hasAttribute('price-v2-init')) {
        v.setAttribute('price-v2-init', '');
        const currentPriceCents = Number(v.textContent.slice(1)) * 100;

        if (!v.previousElementSibling) {
          const prePriceElement = this.#buildPrePriceElement(
            v,
            currentPriceCents
          );

          v.insertAdjacentElement('beforebegin', prePriceElement);
        }

        v.textContent = this.ShopifyUtils.formatMoney(
          currentPriceCents - currentPriceCents * this.discount
        );
      }
    });
  }

  async updateRegimePriceV2(variant, priceV2Span) {
    await this.sitewideTierReady;
    if (!this.sitewideTier || !this.#checkApplicableVariant(variant)) return;

    const formSelect = priceV2Span.closest('form').querySelector('select');
    const currentPriceCents = Number(
      formSelect.options[formSelect.selectedIndex].getAttribute('price-act')
    );
    const pricePreviousSibling = priceV2Span.previousElementSibling;

    if (!pricePreviousSibling?.hasAttribute('compare-at')) {
      pricePreviousSibling?.remove();

      const prePriceElement = this.#buildPrePriceElement(
        priceV2Span,
        currentPriceCents
      );

      priceV2Span.insertAdjacentElement('beforebegin', prePriceElement);
    }

    priceV2Span.textContent = this.ShopifyUtils.formatMoney(
      currentPriceCents - currentPriceCents * this.discount
    );
  }

  /**
   * Updates the product thumbnail price based on the sitewide tier discount.
   * @param {string} variant - The variant to update the price for.
   * @param {string} priceHtmlStr - The HTML string containing the product pricing information.
   * @returns {Promise<string>} The modified HTML string w/ the updated price, if applicable.
   */
  async updateGlobalProductPriceV2(variant, priceHtmlStr) {
    await this.sitewideTierReady;
    if (!this.sitewideTier || !this.#checkApplicableVariant(variant))
      return priceHtmlStr;

    const priceHtml = new DOMParser().parseFromString(
      priceHtmlStr,
      'text/html'
    );
    const priceActual = priceHtml.querySelector(`span.price-v2__${variant}`);
    const currentPriceCents = Number(priceActual.textContent.replace(',','.').slice(1)) * 100;

    if (!priceActual.previousElementSibling) {
      const prePriceElement = this.#buildPrePriceElement(
        priceActual,
        currentPriceCents
      );
      prePriceElement.classList.add('cell-r--d3');
      priceActual.insertAdjacentElement('beforebegin', prePriceElement);
    }

    priceActual.classList.add('f-w600');
    priceActual.textContent = this.ShopifyUtils.formatMoney(
      currentPriceCents - currentPriceCents * this.discount
    );

    return priceHtml.body.innerHTML;
  }

  /**
   * Updates the data-price attribute for price-v2 select options.
   * @param {string} variant - The variant to update the price for.
   * @param {HTMLElement} element - The element to update.
   * @returns {Promise<void>}
   */
  async updateSelectOptionPrice(variant, element) {
    await this.sitewideTierReady;
    if (!this.sitewideTier || !this.#checkApplicableVariant(variant)) return;

    const priceHtml = parseHTML(element.getAttribute('data-price'));

    const currentPriceCents =
      Number(priceHtml.querySelector('span').textContent.slice(1)) * 100;

    if (priceHtml.querySelector('s') === null) {
      const prePriceElement = this.#buildPrePriceElement(
        priceHtml.querySelector('span'),
        currentPriceCents
      );

      priceHtml.prepend(prePriceElement);
    }

    priceHtml.querySelector('span').textContent = this.ShopifyUtils.formatMoney(
      currentPriceCents - currentPriceCents * this.discount
    );

    let dataPriceContent = '';
    for (const child of priceHtml.childNodes) {
      dataPriceContent += child.outerHTML || child.nodeValue;
    }

    element.setAttribute('data-price', dataPriceContent);
  }

  /**
   * Updates the data-label attr of a select option element based on the given variant.
   *
   * @param {Object} variant - The variant object to check.
   * @param {HTMLElement} element - The HTML element (option) whose label will be updated.
   * @returns {Promise<void>}
   */
  async updateSelectOptionLabel(variant, element) {
    await this.sitewideTierReady;
    if (
      !this.sitewideTier ||
      !this.#checkApplicableVariant(variant) ||
      this.sitewideTier.label === ''
    )
      return;

    const dataLabel = element.getAttribute('data-label');
    const labelHtml = new DOMParser().parseFromString(dataLabel, 'text/html');

    labelHtml.body.querySelector(
      '.label-wrapper'
    ).innerHTML = `<span class='badge-v2 badge-v2__product-card' aria-label='${this.sitewideTier.label}'>${this.sitewideTier.label}</span>`;

    element.setAttribute('data-label', labelHtml.body.innerHTML);
  }

  /**
   * Updates the price element within the quick view container based on the sitewide
   * tier discount. Additionally updates all select options with sitewide data.
   * @param {string} content - The quick view content.
   * @returns {Promise<string>}
   */
  async updateQuickView(content) {
    await this.sitewideTierReady;

    // exit early if no sitewide tier
    if (!this.sitewideTier) return content;

    const parser = new DOMParser();
    const quickviewHtml = parser
      .parseFromString(content, 'text/html')
      .querySelector('global-product-quick-view');

    let variant = quickviewHtml
      .querySelector('input[data-variant-id]')
      ?.getAttribute('data-variant-id');

    // temp fix for legacy bundles
    if (!variant) {
      variant = quickviewHtml
        .querySelector('.wayfx-product__grid[data-variant-id]')
        ?.getAttribute('data-variant-id');
    }

    await this.updatePriceV2(variant, quickviewHtml);
    await this.updateLabelV2(variant, quickviewHtml);

    const quickviewOptions = quickviewHtml.querySelectorAll('select option');
    for (const option of quickviewOptions) {
      await Promise.all([
        this.updateSelectOptionPrice(option.value, option),
        this.updateSelectOptionLabel(option.value, option),
      ]);
    }

    return quickviewHtml.outerHTML || '';
  }

  /**
   * Updates the displayed prices for subscription and one-time purchase options,
   * based on compare-at and sitewide pricing.
   *
   * @param {String} variant - The product variant id to check against applicable variants.
   * @param {Document|HTMLElement} [src] - The element to query from for price elements.
   *
   */
  async updateSubscriptionPricing(variant, src = document) {
    await this.sitewideTierReady;
    if (!this.sitewideTier || !this.#checkApplicableVariant(variant)) {
      return;
    }

    // always update onetime purchase price, but check whether to update subscribe & save price
    const priceTypeSuffixes = this.sitewideTier.discountSubs
      ? ['onetime', 'subsave']
      : ['onetime'];

    priceTypeSuffixes.forEach(p => {
      const subscriptionPrices = src.querySelectorAll(
        `.rc_widget__price--${p}`
      );

      setTimeout(() => {
        subscriptionPrices.forEach(v => {
          // update current price
          const currentPriceCents = Number(v.textContent.slice(1)) * 100;
          v.textContent = this.ShopifyUtils.formatMoney(
            currentPriceCents - currentPriceCents * this.discount,
            `${window.cartCurrencySymbol}{{ amount_with_period_separator }}`
          );

          // update previous price
          const prevPrice = v.previousElementSibling;
          if (prevPrice && !prevPrice.textContent.length) {
            prevPrice.textContent = this.ShopifyUtils.formatMoney(
              currentPriceCents,
              `${window.cartCurrencySymbol}{{ amount_with_period_separator }}`
            );
          }
        });
      }, 0);
    });
  }

  /**
   * Updates the displayed prices for regime subscription and one-time purchase options,
   * based on compare-at prices from the regime product card and sitewide pricing.
   *
   * @param {String} variant - The product variant id to check against applicable variants.
   * @param {Document|HTMLElement} [src] - The element to query from for price elements.
   *
   */
  async updateRegimeSubscriptionPricing(variant, src = document) {
    await this.sitewideTierReady;
    if (!this.sitewideTier || !this.#checkApplicableVariant(variant)) {
      return;
    }
    // always update onetime purchase price, but check whether to update subscribe & save price
    const priceTypeSuffixes = this.sitewideTier.discountSubs
      ? ['onetime', 'subsave']
      : ['onetime'];

    priceTypeSuffixes.forEach(p => {
      const subscriptionPrices = src.querySelectorAll(
        `.rc_widget__price--${p}`
      );

      setTimeout(() => {
        subscriptionPrices.forEach(v => {
          const currentPriceCents = Number(v.textContent.slice(1)) * 100;
          v.textContent = this.ShopifyUtils.formatMoney(
            currentPriceCents - currentPriceCents * this.discount,
            `${window.cartCurrencySymbol}{{ amount_with_period_separator }}`
          );

          const shopifyCompareAt = v
            .closest('form')
            .querySelector('.regime-product-card__submit s.price-v2-pdp')
            .getAttribute('compare-at');

          const prevPrice = v.previousElementSibling;
          if (prevPrice) {
            prevPrice.textContent = this.ShopifyUtils.formatMoney(
              shopifyCompareAt ?? currentPriceCents,
              `${window.cartCurrencySymbol}{{ amount_with_period_separator }}`
            );
          }
        });
      }, 0);
    });
  }

  /**
   * Updates all label elements of a specific variant within the given source element.
   *
   * @param {Object} variant - The variant object to check.
   * @param {Document|HTMLElement} [src] - The source element to query for labels.
   * @returns {Promise<void>}
   */
  async updateLabelV2(variant, src = document) {
    await this.sitewideTierReady;
    if (
      !this.sitewideTier ||
      !this.#checkApplicableVariant(variant) ||
      this.sitewideTier.label === ''
    )
      return;

    const labels = src.querySelectorAll(`.label-wrapper__${variant}`);
    labels.forEach(label => {
      const labelType = label.getAttribute('data-type');
      label.innerHTML = this.#buildLabelElement(
        labelType,
        this.sitewideTier.label
      );
    });
  }

  /**
   * Updates the product thumbnail label based on the sitewide tier discount, if applicable.
   * @param {string} variant - The variant to update the label for.
   * @param {string} labelHtmlStr - The initial HTML string of the product thumbnail.
   * @returns {Promise<string>} The original or sitewide updated label HTML string
   */
  async updateGlobalProductThumbnailLabelV2(variant, labelHtmlStr) {
    await this.sitewideTierReady;
    if (
      !this.sitewideTier ||
      !this.#checkApplicableVariant(variant) ||
      this.sitewideTier.label === ''
    )
      return labelHtmlStr;

    return this.#buildLabelElement('product-card', this.sitewideTier.label);
  }

  async variantHasLabel(variant) {
    await this.sitewideTierReady;
    return !!(
      this.sitewideTier &&
      this.#checkApplicableVariant(variant) &&
      this.sitewideTier.label !== ''
    );
  }

  /**
   * Checks if a variant is applicable for the sitewide discount.
   * @param {string} variant - The variant to check.
   * @returns {boolean}
   */
  #checkApplicableVariant(variant) {
    const methodHandlers = {
      all: () => {
        return true;
      },
      allow_specific: () => {
        return this.#checkVariantPresence(variant, this.allVariants, true);
      },
      block_specific: () => {
        return this.#checkVariantPresence(variant, this.allVariants, false);
      },
    };

    return methodHandlers[this.discountMethod]();
  }

  /**
   * Finds the active discount with the largest discount amount.
   * @param {Object} allDiscounts - All available discounts.
   * @param {string} discountCodes - Active discount codes in the cart.
   * @returns {Object|null}
   */
  #getActiveDiscount(allDiscounts, discountCodes) {
    const now = new Date();
    const discountsArr = Object.values(allDiscounts);

    // get all validated TD2 - ie they are active & tags match
    let validatedDiscounts = discountsArr.filter(d => {
      const startsAt = new Date(d.startsAt);
      const endsAt = d.endsAt ? new Date(d.endsAt) : null;
      const discountTags = d.customerTags;
      return (
        now > startsAt &&
        (!endsAt || now < endsAt) &&
        (discountTags.length === 0 ||
          this.#checkTags(discountTags, this.customerTags))
      );
    });

    // remove discounts of type discount code if not active in cart
    // ? discountCodes is a str. Shopify supports multiple active discount codes
    // ? but currently, this will only ever be a string, or false, so treating as such.
    validatedDiscounts = validatedDiscounts.filter(
      d => !d.discountCode || d.discountCode === discountCodes
    );

    // get the discount with the biggest tier.amount value
    const discountWithMaxAmount = validatedDiscounts.reduce(
      (maxItem, currentItem) => {
        const maxCurrentAmount = Math.max(
          ...currentItem.tiers.map(tier => tier.amount)
        );
        const maxMaxAmount = maxItem
          ? Math.max(...maxItem.tiers.map(tier => tier.amount))
          : -Infinity;

        return maxCurrentAmount > maxMaxAmount ? currentItem : maxItem;
      },
      null
    );

    return discountWithMaxAmount;
  }

  /**
   * Finds the active tier for a discount based on the current spend.
   * @param {Object} discount - The discount object.
   * @param {number} spend - The total spend amount.
   * @returns {Object|null}
   */
  #getActiveTier(discount, spend) {
    const descTiers = discount.tiers.sort((a, b) => b.threshold - a.threshold);
    let activeTier;
    for (const tier of descTiers) {
      const spendThreshold = tier.calcDiscountTotal
        ? tier.thresholdWithMultiplier
        : tier.threshold;
      if (spend >= spendThreshold * 100) {
        activeTier = tier;
        break;
      }
    }
    return activeTier;
  }

  /**
   * Checks the presence of a variant in a list of all variants.
   * @param {string} variant - The variant to check.
   * @param {Array} allVariants - The list of all variants.
   * @param {boolean} shouldAllow - Whether the variant should be allowed.
   * @returns {boolean}
   */
  #checkVariantPresence(variant, allVariants, shouldAllow) {
    const hasValue = allVariants.some(element => element === variant);
    return shouldAllow ? hasValue : !hasValue;
  }

  /**
   * Checks if customer tags match discount tags.
   * @param {Array} discountTags - The discount tags.
   * @param {Array} customerTags - The customer tags.
   * @returns {boolean}
   */
  #checkTags(discountTags, customerTags) {
    const normalisedCustomerTags = customerTags.map(tag => tag.toLowerCase());
    return discountTags.some(discountTag =>
      normalisedCustomerTags.includes(discountTag.toLowerCase())
    );
  }

  /**
   * Builds the pre-price element for displaying the original price.
   * @param {HTMLElement} priceActualElement - The actual price element.
   * @param {number} currentPriceCents - The current price in cents.
   * @returns {HTMLElement}
   */
  #buildPrePriceElement(priceActualElement, currentPriceCents) {
    const priceActualClasses = priceActualElement.classList;
    const pricePreClasses = [...priceActualClasses]
      .map(c => c.replace('actual', 'pre'))
      .slice(0, -1);

    const prePriceElement = document.createElement('s');
    prePriceElement.classList.add(...pricePreClasses);
    prePriceElement.setAttribute('aria-hidden', 'true');
    prePriceElement.textContent =
      this.ShopifyUtils.formatMoney(currentPriceCents);

    return prePriceElement;
  }

  /**
   * Builds the HTML string for a label element based on the specified type and label text.
   *
   * @param {string} type - The type of label to create.
   * @param {string} labelText - The text to display in the label.
   * @returns {string} The HTML string for the label element.
   */
  #buildLabelElement(type, labelText) {
    const labelTypes = {
      pdp: () => {
        return `<span class='badge-v2 badge-v2__pdp' aria-label='${labelText}'>${labelText}</span>`;
      },
      'product-card': () => {
        return `<span class='badge-v2 badge-v2__product-card block-z3' aria-label='${labelText}'>${labelText}</span>`;
      },
    };

    return labelTypes[type]();
  }
}

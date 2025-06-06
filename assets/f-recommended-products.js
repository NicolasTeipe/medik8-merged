class RecommendedProducts extends HTMLElement {
  constructor() {
    super();

    this.apiObserver$ = new ObserverLite();
    this.apiObserver$.subscribe(this.getStorefrontData.bind(this));

    this.productsReadyObserver$ = new ObserverLite();
    this.productsReadyObserver$.subscribe(this.buildProducts.bind(this));

    this.route = window.Shopify.routes.root;
    this.productsNum = 4;
    this.intents = ['complementary', 'related'];
    this.products = [];
  }

  connectedCallback() {
    this.productId = this.getAttribute('product-id');
    this.currency = this.getAttribute('currency');
    this.sitewide = this.getAttribute('sitewide');
    this.getProductData(this.intents);
    this.initKeenSlider();
  }

  /**
   * Get product data from the Shopify recommendations API
   * @param {array} intents - A list of intent params.
   *                          Can be 'complementary', 'related', or both.
   */
  async getProductData(intents) {
    try {
      const intent = intents.shift();
      const r = await fetch(
        `${this.route}recommendations/products.json?product_id=${this.productId}&limit=${this.productsNum}&intent=${intent}`
      );
      const data = await r.json();
      this.products.push(...data.products);

      // decide if need to fetch more product data or notify observer
      this.products.length >= this.productsNum || intents.length === 0
        ? this.apiObserver$.next()
        : this.getProductData(intents);
    } catch (error) {
      // hide section if there is an error fetching product data
      console.error('Error:', error);
      this.style.display = 'none';
    }
  }

  /**
   * Use the storefront API to pull in additional data for
   * products pulled in from the recommendations API.
   */
  async getStorefrontData() {
    const productData = this.products.slice(0, this.productsNum);
    const productGids = productData.map(d => `gid://shopify/Product/${d.id}`);
    const gQuery = this.gQueryMetafields();

    try {
      const r = await fetch(
        `https://${window.Shopify.shop}/api/${window.Shopify.storefrontApi.version}/graphql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token':
              window.Shopify.storefrontApi.token,
          },
          body: JSON.stringify({
            query: gQuery,
            variables: { ids: productGids },
          }),
        }
      );

      const data = await r.json();

      // combine gql metafield data with main productData array
      for (let obj of data.data.nodes) {
        const id = obj.id.split('/Product/')[1];
        const productDataItem = productData.find(x => x.id === Number(id));
        if (productDataItem) {
          Object.assign(productDataItem, obj);
        }
      }

      this.productsReadyObserver$.next(productData);
    } catch (error) {
      // hide section if there is an error fetching product data
      console.error('Error:', error);
      this.style.display = 'none';
    }
  }

  /**
   * Initialise the slider
   */
  initKeenSlider() {
    this.slider = new KeenSlider('.rec-products__wrapper', {
      loop: false,
      slides: {
        perView: 1.5,
        spacing: 12,
      },
      breakpoints: {
        '(min-width: 768px)': { slides: { perView: 3 } },
        '(min-width: 1024px)': { slides: { perView: 4 } },
      },
    });
  }

  /**
   * Update product cards with data pulled in from API's
   * @param {array} productData - data combined from the recommendations & storefront API's
   */
  buildProducts(productData) {
    const productCards = this.querySelectorAll('li');
    productData.forEach((productInfo, idx) => {
      const productCard = productCards[idx];
      this.setProductDetails(productCard, productInfo);
      this.setProductHref(productCard, productInfo);
      // this.setProductSizePrice(productCard, productInfo);
      this.setProductBadge(productCard, productInfo);
      this.setOptionsValues(productCard, productInfo);
      this.setPrice(productCard, productInfo);
    });

    // Once built, show content and ensure heights are even
    // for title & subheading across all products
    this.showTextContent();
    this.adjustHeights('.js-pc_title');
    this.adjustHeights('.js-pc-subheading');

    // *** END ***
  }

  // >> Helper Methods

  /**
   * Update a single product card with data for that product:
   * - Image, title, subheading, reviews & size/price
   * @param {element} productCard - the product card element
   * @param {obj} productInfo - data for an individual product
   */
  setProductDetails(productCard, productInfo) {
    const productImage = productCard.querySelector('img');
    productImage.src = productInfo.featured_image;

    const productTitle = productCard.querySelector('.js-pc_title');
    productTitle.textContent = productInfo.title;

    // get product sizes to append to subheading
    const productSize = this.getMetaFieldValue(productInfo, 'size')
      ? ` - ${this.getMetaFieldValue(productInfo, 'size')}`
      : '';

    const productSubheading = productCard.querySelector('.js-pc-subheading');
    productSubheading.textContent = `${this.getMetaFieldValue(
      productInfo,
      'sub_heading'
    )}${productSize}`;

    const productReviews = productCard.querySelector('.js-pc_reviews');
    const reviewHTML = this.getMetaFieldValue(productInfo, 'catalog_bottomline')
      ?.replace(' Reviews', '')
      ?.replace(' Review', '');

    if (reviewHTML) {
      productReviews.innerHTML = reviewHTML;
      const productReviewLink =
        productReviews.querySelector('.js-pc_reviews a');
      productReviewLink?.removeAttribute('href');
    } else {
      productReviews.style.height = "17px"
    }
  }

  /**
   * Retrieve a single metafield value based on its key
   * @param {obj} productInfo - data for an individual product
   * @param {str} key - metafield key value to match on
   */
  getMetaFieldValue(productInfo, key) {
    return productInfo.metafields.find(m => m?.key === key)?.value;
  }

  /**
   * add hrefs to all product card <a>'s
   * @param {element} productCard - the product card element
   * @param {obj} productInfo - data for an individual product
   */
  setProductHref(productCard, productInfo) {
    productCard.querySelectorAll('.js-href').forEach(c => {
      c.href = `/products/${productInfo.handle}#shopify-section-product-reviews`;
    });
  }

  /**
   * Set the size & price for the product
   * @param {element} productCard - the product card element
   * @param {obj} productInfo - data for an individual product
   */
  setProductSizePrice(productCard, productInfo) {
    const productSize = this.getMetaFieldValue(productInfo, 'size');
    const sizeElement = productCard.querySelector('.js-pc_size');
    const priceElement = productCard.querySelector('.js-pc_price');

    productSize
      ? (sizeElement.textContent = `${productSize}`)
      : (sizeElement.style.display = 'none');

    const comparePrice = this.formatPrice(
      productInfo.variants[0].compare_at_price
    );
    const actualPrice = this.formatPrice(productInfo.variants[0].price);

    priceElement.innerHTML = `${
      comparePrice === null ? '' : `<s>${comparePrice}</s>`
    }<span>${actualPrice}</span>`;
  }

  setProductBadge(productCard, productInfo) {
    const badgeText = this.getMetaFieldValue(
      productInfo,
      'recommendations_api_badge'
    );

    if (badgeText) {
      let newBadge = document.createElement('span');
      newBadge.classList.add('product-card__badge');
      newBadge.textContent = badgeText;
      productCard.querySelector('.js-img').appendChild(newBadge);
    }
  }

  /**
   * Populates a select element with options based on product variants and manages enabling/disabling
   * the select element as well as updating the 'Add to Basket' button with the correct variant ID.
   * Listen for changes on the select element to update the price element of the ATB button.
   *
   * @param {HTMLElement} productCard - The product card DOM element that contains the price element.
   * @param {Object} productInfo - An object containing information about the product and its variants.
   */
  setOptionsValues(productCard, productInfo) {
    const selectElement = productCard.querySelector('select');

    productInfo.variants.forEach(v => {
      var option = document.createElement('option');
      option.value = v.id;
      option.textContent =
        v.title === 'Default Title' ? productInfo.title : v.title;

      selectElement.appendChild(option);
    });

    // disable select if only 1 option
    if (selectElement.options.length < 2) {
      selectElement.setAttribute('disabled', true);
      selectElement.classList.add('single');
    }

    // update atb button with variant id on creation & change
    productCard
      .querySelector('.atb')
      .setAttribute('data-variant-id', productInfo.variants[0]?.id);

    selectElement.addEventListener('change', () => {
      productCard
        .querySelector('.atb')
        .setAttribute('data-variant-id', selectElement.value);

      // get variant obj from variantid
      const matched = productInfo.variants.find(
        v => v.id === Number(selectElement.value)
      );

      // update price
      this.setPrice(productCard, productInfo, matched);
    });
  }

  /**
   * Sets the price on the product card based on the selected variant or default variant.
   * It applies a sitewide discount if available and formats the prices to show
   * discounted and original prices when applicable.
   *
   * @param {HTMLElement} productCard - The product card DOM element that contains the price element.
   * @param {Object} productInfo - An object containing information about the product and its variants.
   * @param {Object} [selectedVariant] - The currently selected variant object. If not provided,
   *                                     defaults to the first variant in `productInfo.variants`.
   */
  setPrice(productCard, productInfo, selectedVariant) {
    selectedVariant = selectedVariant || productInfo.variants[0];

    const checkAndSetPrice = () => {
      const priceElement = productCard.querySelector('.js-price');
      if (!priceElement) return;

      const sitewideModifier =
        1 - Number(this.sitewide / 100);

      if (selectedVariant.compare_at_price) {
        priceElement.innerHTML = `<s class="cell-r--d2">${this.formatPrice(
          selectedVariant.compare_at_price
        )}</s>${this.formatPrice(selectedVariant.price)}`;
      } else if (sitewideModifier < 1) {
        priceElement.innerHTML = `<s class="cell-r--d2">${this.formatPrice(
          selectedVariant.price
        )}</s>${this.formatPrice(selectedVariant.price * sitewideModifier)}`;
      } else {
        priceElement.textContent = this.formatPrice(selectedVariant.price);
      }
    };

    // Only set price if the price element is available - otherwise, wait.
    if (productCard.querySelector('.js-price')) {
      checkAndSetPrice();
    } else {
      const observer = new MutationObserver(mutations => {
        for (let mutation of mutations) {
          if (mutation.addedNodes.length) {
            checkAndSetPrice();
            observer.disconnect();
            break;
          }
        }
      });

      observer.observe(productCard, { childList: true, subtree: true });
    }
  }

  /**
   * Converts a price from pennies to a currency unit (e.g., £'s),
   * then formats the result as a string, prefixed with a currency symbol.
   * @param {number} priceData - The price in cents.
   * @return {string} - The formatted price.
   */
  formatPrice(priceData) {
    // If priceData is null or undefined, return null
    if (!priceData) return null;

    // convert priceData to a currency unit
    let priceFloat = priceData / 100;

    // Format the price as a string, adding the currency symbol
    let price = Number.isInteger(priceFloat)
      ? `${this.currency}${priceFloat}`
      : Shopify.formatMoney(priceData, `${this.currency}{{ amount }}`);

    return price;
  }

  /**
   * Unhide text elements to reveal product data
   */
  showTextContent() {
    this.querySelectorAll('.hide-on-load').forEach(e =>
      e.classList.remove('hide-on-load')
    );
  }

  /**
   * Adjusts the height of all elements matching the provided selector to be
   * equal to the height of the tallest element.
   * @param {string} selector - The CSS selector used to select the elements.
   */
  adjustHeights(selector) {
    const elements = this.querySelectorAll(selector);
    const currentMaxHeight = Array.from(elements).reduce(
      (maxHeight, e) => Math.max(maxHeight, e.offsetHeight),
      0
    );
    elements.forEach(e => (e.style.height = `${currentMaxHeight}px`));
  }

  /**
   * graphQL query string to pull in metafield data
   * @returns graphQL query string
   */
  gQueryMetafields() {
    const query = `
      query MyQuery ($ids: [ID!]!){
        nodes(ids: $ids) {
          ... on Product {
            id
            metafields(identifiers: 
              [
                {namespace: "yotpo", key: "catalog_bottomline"},
                {namespace: "sf_product_hero", key: "sub_heading"},
                {namespace: "sf_product_hero", key: "size"},
                {namespace: "pdp", key: "recommendations_api_badge"}
              ]) {
              value
              key
              namespace
            }
          }
        }
      }
    `;
    return query;
  }
}

customElements.define('recommended-products', RecommendedProducts);

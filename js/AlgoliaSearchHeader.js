import { DomReadyPromise } from './DomReadyPromise';
import { parseHTML } from './parseHTML';
import { debounce } from './debounce';
import { AgSearchUtil , AgSearchInsightsUtil } from './dist.algolia-search';
import { KSnavigation } from '../assets/scripts.keenSlider.plugins';


export class AlgoliaSearchHeader extends HTMLElement {
  constructor() {
    super();

    this.query = '';
    this.hasBeenOpened = false;
    this.maxProductsDisplay = 4;
    this.previousProductResults;

    this._searchData = null;
    this._linksData = null;
    this._productData = null;

    // ? temporary solution to limit number of links displayed
    this.LinksMax = 6;
    this.cartCloseBtnTimeout
  }

  // * -------------------------------- * //
  // * ---------- Lifecycles ---------- * //
  // * -------------------------------- * //

  async connectedCallback() {
    await DomReadyPromise();

    this.agForm = this.querySelector('form');
    this.agFormInput = this.querySelector('form input');
    this.agProducts = this.querySelector('.ag-products');
    this.agLinks = this.querySelector('.ag-links');
    this.mask = document.querySelector(
      '.shopify-section.algolia .algolia-mask'
    );

    // pull in config data from html
    const htmlDataTemplate = this.querySelector('template');
    if (htmlDataTemplate) {
      this.config = JSON.parse(htmlDataTemplate.innerHTML);
      htmlDataTemplate.remove();
    }

    this.initHeaderSearchIcon();
    this.initCloseButton();
    this.initMaskClose();
    this.initForm();

    // init search obj
    this.agSearch = await new AgSearchUtil({
      app_id: this.config.agConfig.appId,
      search_api_key: this.config.agConfig.publicApi,
    });
    this.agSearchInsightsUtil = new AgSearchInsightsUtil({
      app_id: this.config.agConfig.appId,
      search_api_key: this.config.agConfig.publicApi,
    })
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'query' && newValue !== oldValue) {
      this.query = newValue;
      this.performSearch(newValue);
    }
  }

  // * ----------------------------- * //
  // * ---------- Statics ---------- * //
  // * ----------------------------- * //

  static get observedAttributes() {
    return ['query'];
  }

  // * ----------------------------- * //
  // * ---------- GetSets ---------- * //
  // * ----------------------------- * //

  get searchData() {
    return this._searchData;
  }

  set searchData(value) {
    this._searchData = value;
    this.buildLinksData();

    // build product results only if they differ to the previous search results
    if (
      !this.arrayCompare(
        this.previousProductResults.map(p => p.sku),
        this.searchData.products.hits.map(p => p.sku)
      )
    )
      this.buildProductData();
  }

  get linksData() {
    return this._linksData;
  }

  set linksData(value) {
    this._linksData = value;
    this.renderLinks();
  }

  get productData() {
    return this._productData;
  }

  set productData(value) {
    this._productData = value;
    this.renderProducts();
  }

  // * -------------------------------------- * //
  // * ----- Event Handlers & Listeners ----- * //
  // * -------------------------------------- * //

  /**
   * Initializes the search form to capture input and
   * uses the 'debounce' utility to limit the frequency of search queries.
   */
  initForm() {
    this.agFormInput.addEventListener(
      'keyup',
      debounce(e => {
        this.setAttribute('query', e.target.value);
      }, this.config.agConfig.debounce)
    );
  }

  /**
   * Sets up the search icon in the header, toggling the search bar on click.
   */
  initHeaderSearchIcon() {
    const headerSearchIcon = document.getElementById('header-search-icon');
    const menuToggle = document.querySelector('.js-sidebar-mobile__toggle')
    const cartButton = document.querySelector(".js-cart-toggle.mh__icon-nav-item")
    
    // Open search
    headerSearchIcon.addEventListener('click', () => {
      
      // Close mobile menu
      if (menuToggle) {
        if(menuToggle.classList.contains('active')) {
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.classList.remove('active')
          window.globalJsSidebarNavWrapper.close()
          clearTimeout(this.cartCloseBtnTimeout)
          this.cartCloseBtnTimeout = setTimeout(() => {
            document.body.classList.remove('mobile-menu')
            this.classList.contains('hide') ? this.openSearch() : this.closeSearch();
          }, 250);
        } else {
          this.classList.contains('hide') ? this.openSearch() : this.closeSearch();
        }
      // Close the drawer cart
      } else if (cartButton) {
        cartButton.setAttribute('aria-expanded', 'false');
        this.classList.contains('hide') ? this.openSearch() : this.closeSearch();
      } else {
        this.classList.contains('hide') ? this.openSearch() : this.closeSearch();
      }
    });
  }

  /**
   * Initializes the close button for the search interface.
   */
  initCloseButton() {
    const closeButton = document.getElementById('algoliaSearchClose');
    closeButton.addEventListener('click', () => this.closeSearch());
  }

  /**
   * Sets up the behavior to close the search interface when the mask area is clicked.
   */
  initMaskClose() {
    this.mask.addEventListener('click', () => this.closeSearch());
  }

  // * ------------------------------ * //
  // * ---------- Builders ---------- * //
  // * ------------------------------ * //

  /**
   * Generates data for link-type search results based on the current search data.
   * Filters non-product indices to build navigable links for other content types.
   */
  buildLinksData() {
    this.agLinks.innerHTML = '';

    const linksArray = [];
    this.linksCount = 0;

    Object.keys(this.config.agConfig.indices).forEach(k => {
      if (k == 'products') return;

      // build link title & url kv pairs
      let data = {};
      this.searchData[k]?.hits.forEach(n => {
        this.linksCount += 1;
        let optBlogHandle = k == 'articles' ? `${n.blog.handle}/` : '';
        const p = k === 'articles' ? 'blogs' : k;
        data[n.title] = {
          title:n.title,
          url:`/${p}/${optBlogHandle}${n.handle}`,
          objectID:n.objectID,
          agSearchIndexName:n.agSearchIndexName
        }
      });

      linksArray.push({ [k]: data });
    });

    const resultsToMerge = ['pages', 'articles'];
    const mergedLinksArray = this.mergeResults(
      linksArray,
      resultsToMerge,
      'content'
    );

    this.updateTitles(mergedLinksArray);

    this.linksData = this.linksCount
      ? mergedLinksArray
      : this.config.defaultLinks;
  }
  /**
   * Updates productData with an array of product results
   */
  buildProductData() {
    this.productData = this.searchData.products.hits;
  }

  /**
   * Renders link search results into the DOM.
   */
  renderLinks() {
    // limit number of links when displaying algolia content
    const endIndex = this.query && this.linksCount ? this.LinksMax : 10;
  
    const html = this.linksData
      .map(category => {
        const [title, links] = Object.entries(category)[0];
        const linksHtml = Object.entries(links)
          .slice(0, endIndex)
          .map(
            (item) => {
              // default items are passed as a string (the url)
              if(typeof item[1] === 'string'){
                const [title,url] = item
                return `
                <li class="t-xs lh-rm ticklist ls-10">
                  <a href="${url}" >
                    ${title}
                  </a>
                </li>
              `
              }else{
                const {title,url,objectID,agSearchIndexName} = item[1]
                return `
                  <li class="t-xs lh-rm ticklist ls-10">
                    <a href="${url}" 
                       data-ag_index="${agSearchIndexName}"
                       data-ag_object_id="${objectID}"
                      >
                      ${title}
                    </a>
                  </li>
                `
              }
            }
          )
          .join('');

        return linksHtml
          ? `<div class="ag-links__wrapper"><h2 class="t-s f-w600 lh-r t-ucase ls-12">${title}</h2><ul>${linksHtml}</ul></div>`
          : null;
      })
      .join('');

    this.agLinks.innerHTML = html;
    // click event tracking
    this.agLinks.querySelectorAll('a[data-ag_index]').forEach(item => {
      item.addEventListener('click',(e) => {
        const {ag_index,ag_object_id} = item.dataset
        this.agSearchInsightsUtil.sendItemClickEvent({
          index:ag_index,
          objectIDs:[ag_object_id]
        })
      })
    })
  }

  /**
   * Displays product search results in the UI.
   */
  renderProducts() {
    this.renderResultsTitle();

    // render product results
    const productsArray = this.productData.length
      ? this.productData.slice(0, this.maxProductsDisplay)
      : this.defaultProducts;

    const productsHtml = productsArray
      .map(p => {
        const image = p.image;
        const title =
          p.variant_title &&
          p.variant_title !== 'Default Title' &&
          !p.option_names.includes('size')
            ? p.variant_title
            : p.title;
        const description = p.meta?.sf_product_hero?.sub_heading || '';
        const price = p.price; // not currently used
        const urlVariant = p.objectID ? `?variant=${p.objectID}` : '';
        const url = `/products/${p.handle}${urlVariant}`;

        const badgeContent = p.meta?.custom?.badge || null
        const badgeHtml = !badgeContent
          ? ''
          : `<span class="badge-v2 badge-v2__product-card">${badgeContent}</span>`;

        return `<li class="product-card keen-slider__slide">
          <div>
          <a href="${url}"
             class="block-rel d-block"
             data-ag_index="${p.agSearchIndexName}"
             data-ag_object_id="${p.objectID}">
            <img src="${image}"
              alt="${title}"
              width="400"
              height="400"
              class="product-card__image d-block row--d2">
            ${badgeHtml}
          </a>
          <a href="${url}" class="product-card__title d-block row--d2 t-xs lh-m f-w600 t-ucase tac ls-12">${title}</a>
          <div class="product-card__description d-block row--d2 t-xxxs f-w400 lh-r tac ls-10">${description}</div>
          </div>
        </li>`;
      })
      .join('');

    // ? price block for later - either show price on own or nothing
    // <div class="product-card__price d-block t-xxxs f-w400 lh-r tac">${size}${this.config.settings.currency}${price}</div>

    const html = parseHTML(
      `<ul class="ag-products-slider flex ticklist">${productsHtml}</ul>`
    );

    this.agProducts.querySelector('.ag-products-slider')?.remove();
    this.agProducts.appendChild(html);

    this.buildKeenSlider();

    // click event tracking
    this.agProducts.querySelectorAll('a[data-ag_index]').forEach(item => {
      item.addEventListener('click',(e) => {
        const {ag_index,ag_object_id} = item.dataset
        this.agSearchInsightsUtil.sendItemClickEvent({
          index:ag_index,
          objectIDs:[ag_object_id]
        })
      })
    })
  }

  /**
   * Renders the title area of the search results section.
   */
  renderResultsTitle() {
    const resultsTitleText = {
      noQuery: this.config.translations.results_no_search,
      hasData: this.config.translations.results_true,
      noData: this.config.translations.results_false,
    };

    const key = !this.query
      ? 'noQuery'
      : this.productData.length
      ? 'hasData'
      : 'noData';

    const resultsHeader = resultsTitleText[key];

    const linkTitle =
      !this.query || !this.productData.length
        ? this.config.translations.shop_all
        : this.config.translations.view_all;
    const linkUrl =
      !this.query || !this.productData.length
        ? this.config.settings.shop_all_url
        : `/search?q=${this.query}&view=ag`;

    // render top bar
    const resultsTitleHtml =
      parseHTML(`<div class="results-title flex justify-space row--d2">
          <span class="t-rm f-w600 ls-10">${resultsHeader}</span>
          <a href="${linkUrl}" class="t-xxs f-w600 t-ucase t-ul flex align-center ls-12">${linkTitle}</a>
        </div>`);

    this.agProducts.querySelector('.results-title')?.remove();
    this.agProducts.appendChild(resultsTitleHtml);
  }

  /**
   * Initializes and configures the slider for displaying search results.
   */
  buildKeenSlider() {
    this.resultSlider?.destroy();

    this.waitForKeenSlider().then(() => {
      this.resultSlider = new KeenSlider(
        '.ag-products-slider',
        {
          loop: false,
          slides: {
            perView: 2,
            spacing: 12,
          },
          breakpoints: {
            '(min-width: 768px)': { slides: { perView: 3, spacing: 12 } },
            '(min-width: 1024px)': { slides: { perView: 4 } },
          },
          created: () => {
            if (!this.classList.contains('hide'))
              setTimeout(() => {
                this.adjustHeights('.ag-products .product-card__title');
              }, 50);
          },
        },
        [KSnavigation]
      );
    });
  }

  // * ----------------------------- * //
  // * ---------- General ---------- * //
  // * ----------------------------- * //

  /**
   * Opens the search interface and prepares it for user interaction.
   */
  openSearch() {
    if (!this.hasBeenOpened) {
      this.hasBeenOpened = true;
      this.linksData = this.config.defaultLinks;
    }

    this.setAttribute('query', this.query); // force a re-render

    document.body.classList.add('search-open');
    this.mask.classList.remove('hide');

    this.classList.remove('hide');
    this.buildKeenSlider();
    this.agFormInput.focus();
  }

  /**
   * Closes the search interface and cleans up the UI state.
   */
  closeSearch() {
    document.body.classList.remove('search-open');
    this.mask.classList.add('hide');
    this.classList.add('hide');
  }

  /**
   * Executes the search operation with Algolia, handling both successful and error states.
   * If the query is empty, the method performs a default search using 'empty'
   * Constructs a list of index names to search based on configured indices.
   * @param {string} query - The search query to send to Algolia.
   */
  async performSearch(query) {
    const cfg = this.config.agConfig;
    this.previousProductResults = this.searchData?.products?.hits ?? [];

    const res = await this.agSearch.search({
      query: query ? query : 'empty',
      indexes: Object.keys(cfg.indices).reduce((acc, key) => {
        if (this.config.agConfig.indices[key]) {
          acc.push({
            indexName: `${cfg.prefix}${key}`,
            key: key,
          });
        }
        return acc;
      }, []),
    });

    if (!query) this.defaultProducts = res.products.hits;
    this.searchData = res;
  }

  // * ----------------------------- * //
  // * ---------- Utility ---------- * //
  // * ----------------------------- * //

  /**
   * Adjusts the height of elements matching the given selector to be equal
   * to the height of the tallest element.
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
   * Waits asynchronously for the KeenSlider library to be available before proceeding.
   * @returns {Promise} A promise that resolves when KeenSlider is available.
   */
  async waitForKeenSlider() {
    return new Promise((resolve, reject) => {
      const pingKS = () => {
        if (typeof KeenSlider !== 'undefined') {
          resolve();
        } else {
          setTimeout(pingKS, 100);
        }
      };
      pingKS();
    });
  }

  /**
   * Returns the height of the part of the element that is visible within the current viewport.
   * @param {HTMLElement} element - The DOM element to measure.
   * @returns {number} The height of the visible part of the element.
   */
  getVisibleHeight(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (rect.bottom < 0 || rect.top > windowHeight) {
      return 0;
    } else {
      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, windowHeight);
      return visibleBottom - visibleTop;
    }
  }

  /**
   * Compares two arrays for equality, element by element.
   * @param {Array} arr1 - The first array to compare.
   * @param {Array} arr2 - The second array to compare.
   * @returns {boolean} True if both arrays are equal, false otherwise.
   */
  arrayCompare(arr1, arr2) {
    if (arr1.length !== arr2.length) {
      return false;
    }
    return arr1.every((el, idx) => el === arr2[idx]);
  }

  /**
   * Takes an array of objects and combines those objecs whose key matches
   * any value from the keys array. It does this by creating a new object
   * of the combined values and then deleting the old objects.
   *
   * @param {Array} data - The array of objects to process.
   * @param {Array} keys - The keys to combine into the merged object.
   * @param {string} mergeTitle - The key name for the merged content in the resulting object.
   * @returns {Array} The updated array
   */
  mergeResults(data, keys, mergeTitle) {
    const mergedContent = data.reduce((acc, item) => {
      keys.forEach(key => {
        if (item[key]) {
          acc = { ...acc, ...item[key] };
        }
      });
      return acc;
    }, {});

    const updatedData = data.filter(item => !keys.some(key => key in item));
    updatedData.push({ [mergeTitle]: mergedContent });

    return updatedData;
  }

  /**
   * Updates the keys in each object of an array based on specified title mappings.
   *
   * @param {Array} linksArray - The array of objects whose keys are to be updated.
   */

  updateTitles(linksArray) {
    linksArray.forEach(n => {
      const origTitle = Object.keys(n)[0];

      Object.entries(this.config.settings.titles).forEach(([key, value]) => {
        if (key === Object.keys(n)[0]) {
          const origData = n[origTitle];
          n[value] = origData;
          delete n[origTitle];
        }
      });
    });
  }
}

customElements.define('algolia-search-header', AlgoliaSearchHeader);

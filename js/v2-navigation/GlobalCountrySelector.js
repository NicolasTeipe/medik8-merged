/**
 * @file GlobalCountrySelector.js
  * @summary Creates a custom element for a country selector dropdown.
  * @description This file contains the GlobalCountrySelector class, which creates a custom element for a country selector dropdown. The dropdown contains a list of countries with their respective flags and currencies. The user can select a country from the dropdown to change the current country. The dropdown is hidden by default and can be toggled by clicking on the country flag or name.
 */

export class GlobalCountySelector extends HTMLElement {
  // Constructor sets initial state for the selector's visibility.
  constructor() {
    super()
    this.show = false // Initialize dropdown visibility as hidden

    document.body.addEventListener("hide-country-dropdown", () => {
      if (this.show) {
        this.toggle(true);
      }
    });
  }

  // Called when the component is added to the DOM.
  connectedCallback() {
    if (this.id || !window.location.href.includes('medik8')) {
      return // Prevents re-initialization if already initialized
    }

    DomReadyPromise() // Wait until the DOM is ready
      .then(async () => {
        try {
          // Initialize countries data and settings
          this.countriesData = await new CountriesData()
          this.settings = this.countriesData.settings.selectorSettings

          // Query the script and parse the JSON data
          const scriptElement = this.querySelector('[data-counties-logo-sources]')
          const storageKey = 'countiesLogoSources';
          
          // Countries flag links json data storage
          let jsonData;

          // If scriptElement exists, parse the data from it
          if (scriptElement) {
            jsonData = JSON.parse(scriptElement.innerHTML.trim());
            // Save the parsed data to localStorage
            localStorage.setItem(storageKey, JSON.stringify(jsonData));
          } else {
            // If no scriptElement, check localStorage for saved data
            const storedData = localStorage.getItem(storageKey);
            jsonData = storedData ? JSON.parse(storedData) : null;
          }

          if (jsonData) {
            this.logo_sources = jsonData
          } else {
            throw new Error('[data-counties-logo-sources] not saved.')
          }

          this.show_full_name = this.attributes.show_full_name ? true : false // Check if full country name should be displayed
          this.populateToggle() // Populate the toggle button for selecting country
        } catch (err) {
          console.error('Error:', err)
        }
      })
      .catch(err => {
        console.error('Error:', err)
      })
  }

  // Allows other components to subscribe to updates from ObserverLite.
  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  // Triggers all subscribed callbacks with the provided data.
  next(data){
    this.ObserverLite.next(data)
  }

  // Converts an HTML string to a DOM node.
  htmlToNode(html) {
    const template = document.createElement('template');
    html = html.trim() // Remove whitespace around HTML string
    template.innerHTML = html
    return template.content.firstChild // Return the DOM node
  }

  // Toggles the display of the dropdown, rendering the country list if it hasn't been rendered.
  async toggle(close){
    // if dropdown not rendered, render it
    if (!this.listIsRendered && !close) {
      this.listIsRendered = true // Mark list as rendered
      await this.populateCountryList() // Populate country list dropdown
    }
    if(this.show || close){
      // Hide dropdown if already visible or if close is requested
      this.show = false
      this.countries_dropdown.classList.remove('active')
    }else {
      // Show dropdown if currently hidden
      this.show = !this.show
      if(this.show) {
        this.countries_dropdown.classList.add('active')
      } else {
        this.countries_dropdown.classList.remove('active')
      }
    }
  }

  // Populates the toggle button with the current country data.
  populateToggle(){
    const country = this.countriesData.currentCountry

    if(country){
      // Build the HTML for the toggle button with country flag and name or currency
      const isoCode = Array.isArray(country.isoAlpha2) ? country.isoAlpha2[0] : country.isoAlpha2;
      const flagSrc = this.logo_sources.find(logo => logo.isoAlpha2 === isoCode.toLowerCase())?.url || '';
      const loadingType = Number(country.id) <= 7 ? 'eager' : 'lazy';

      const html = `<div data-country-toggle class="country-selector__active">
                    <div class="country-flag">
                      <img src="${flagSrc}" alt="${country.name} flag" height="18" width="18" loading="${loadingType}" />
                    </div>
                    <div class="country country-name">
                      ${this.show_full_name ?  country.name : country.currency.substring(1)}
                    </div>`
      this.country_toggle = this.htmlToNode(html)
      this.innerHTML = "" // Clear existing content
      this.append(this.country_toggle) // Add the new toggle button

      // Toggle dropdown on click
      this.country_toggle.addEventListener('click', () => {
        this.toggle()
      })
    }
  }

  // Populates the dropdown with a list of countries.
  async populateCountryList(){
    const countriesJSON = await this.countriesData.getCountriesJson()
    if (!countriesJSON) {
      return // Exit if there was an error fetching countries
    }

    // Generate HTML for each country in the list
    // Only include countries with IDs greater than 2
    const countryOptionsHtml = this.countriesData.countries
      .filter(({ id }) => id && id > 2) // Filter countries based on ID
      .map(country => {
        const isoCode = Array.isArray(country.isoAlpha2) ? country.isoAlpha2[0] : country.isoAlpha2;
        const flagSrc = this.logo_sources.find(logo => logo.isoAlpha2 === isoCode.toLowerCase())?.url || '';
        const loadingType = Number(country.id) <= 7 ? 'eager' : 'lazy' // Set loading type based on ID

        // Create HTML string with dynamic loading type and flag source
        return `<a data-filter-item data-filter-name="${country.name}" href="${country.website}">
                  <div class="country-flag">
                    <img 
                      loading="${loadingType}" 
                      src="${flagSrc}" 
                      width="18" height="18" alt="${country.name} flag" />
                  </div>
                  <div class="country country-name">${country.name}</div>
                  <div class="flag-currency push">${country.currency}</div>
                </a>`
      })
      .join('')

    // Wrap country options in a dropdown container
    const dropDownHtml = `<div data-country-dropdown class="country-selector__dropdown">
                            <div class="country-selector__header">
                              <h6 class="country-selector__delivery-title">${this.settings.country_selector_heading}</h6>
                              <span class="country-selector__header-container flex align-center block-rel">
                                <button class="country-selector__close-button modal-close modal-close-btn btn-reset @tablet__show" type="button"></button>
                                <div class="country-search-input-wrapper">
                                  <input class="country-search grow-1" data-search type="text" placeholder="Search for location..."/>
                                </div>
                              </span>
                            </div>
                            <div class="country-selector__countries-container">
                              <div data-countries-wrapper class="country-selector__countries-wrapper">${countryOptionsHtml}</div>
                              <div class="country-selector__country-footer">
                                <small>
                                  <a href="${this.settings.country_selector_footer_url}">${this.settings.country_selector_footer_text}</a>
                                </small>
                              </div>
                            </div>
                          </div>`

    this.countries_dropdown = this.htmlToNode(dropDownHtml)
    this.country_toggle.after(this.countries_dropdown) // Insert dropdown after toggle button

    // Ensures the search input stays open when tapped
    this.querySelector('[data-search]').addEventListener('focus',(e) => {
      e.preventDefault()
      e.stopPropagation()
    })

    // Filters countries based on search input
    this.querySelector('[data-search]').addEventListener('input',(e) => {
      e.preventDefault()
      e.stopPropagation()
      const searchVal = e.target.value.toLowerCase()
      const filterItems = this.querySelectorAll('[data-filter-item]')

      filterItems.forEach((item) => {
        // Show or hide items based on search query
        item.style.display = item.textContent.toLowerCase().includes(searchVal) ? '' : 'none'
      })
    })

    // Close dropdown when clicking outside of it
    document.addEventListener('mouseup',(e) => {
      if (!e.target.closest('.country-selector') && this.show) {
        this.toggle(true)
      }
    })

    // Close dropdown when clicking the close button
    document.querySelectorAll('.country-selector__close-button').forEach( elem =>  elem.addEventListener('click',(e) => {
        if (this.show) {
          e.preventDefault()
          this.toggle(true)
        }
      })
    )

    // Close dropdown on scroll
    window.addEventListener('scroll', () => {
      if (this.show) {
        this.toggle(true)
      }
    })
  }

  
}

// Register the custom element as 'global-country-selector' for use in HTML
customElements.define('global-country-selector', GlobalCountySelector)

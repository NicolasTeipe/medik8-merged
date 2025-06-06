export class CountriesData {
  // Constructor initializes settings, checks for relocation flag, and starts initialization.
  constructor(settings) {
    const observer = new ObserverLite({ key: 'CountriesDataSingleton$' })

    if (settings) {
      this.settings = settings // Store settings object
      this.ObserverLite = new ObserverLite() // Create an instance of ObserverLite for data sharing
      this.countries = [] // Initialize countries as an empty array to avoid errors when iterating
      this.lsKey = `gbl_loco_key2103` // Key for localStorage operations
      const params = this.getParams() // Parse URL parameters
      if (params.relocate) {
        this.setLs('doNotRelocate', true) // Set a flag in localStorage to prevent redirection if 'relocate' param is present
      }
      this.init(observer) // Begin initialization and load countries data
    } else {
      // Return a promise for singleton instance retrieval if settings are not provided
      return new Promise(async resolve => {
        const instance = await observer.once()
        resolve(instance)
      })
    }
  }

  // Getter for the current country based on the market zone.
  get currentCountry() {
    const currentCountry = this.countries.length === 0 ? false : this.countries.filter(({ zone }) => zone === this.market)
    return currentCountry.length > 0 ? currentCountry[0] : false
  }

  // Method to allow other parts of the application to subscribe to updates.
  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  // Triggers all subscribed callbacks with the given data.
  next(data) {
    this.ObserverLite.next(data)
  }

  // Returns a specific country object that matches the given key-value pair.
  getCountry(key,value){
    let item = this.countries.filter( (country) => {
      if(Array.isArray(country[key])){
        return country[key].some( val => val == value)
      }
      return country[key] == value
    })
    return item.length ? item[0] : false
  }

  // Parses URL parameters and returns them as an object.
  getParams(e = window.location.href) {
    const r = {}
    const t = document.createElement('a') // Create a link element to utilize its URL parsing
    t.href = e
    const params = t.search.substring(1).split('&') // Split URL parameters
    params.forEach(param => {
      const [key, val] = param.split('=')
      r[key] = decodeURIComponent(val)
    })
    return r
  }

  // Saves a key-value pair to localStorage under the lsKey.
  setLs(key, value) {
    const data = JSON.parse(window.localStorage.getItem(this.lsKey) || '{}')
    data[key] = value
    window.localStorage.setItem(this.lsKey, JSON.stringify(data))
  }

  // Retrieves and parses data stored under lsKey from localStorage.
  getLs() {
    return JSON.parse(window.localStorage.getItem(this.lsKey) || '{}')
  }

  // Initializes the market, sets default countries data, and loads additional data.
  async init(observer) {
    // Determine market based on URL
    if (window.location.href.indexOf('www.medik8') > -1) {
      this.market = 'GB' // Set to UK market
    } else if (window.location.href.indexOf('us.medik8') > -1) {
      this.market = 'US' // Set to US market
    } else if (window.location.href.indexOf('eu.medik8') > -1) {
      this.market = 'EU' // Set to EU market
    } else {
      this.market = 'INT' // Default set to INT market
    }

    try {
      // Load countries data, then notify observers that instance is ready
      await this.getCountriesJson()
      observer.next(this)
    } catch (err) {
      console.warn('Error in init:', err)
    }
  }

  // Fetches countries data from an external JSON file if not loaded, or returns the existing countries data.
  getCountriesJson() {
    return new Promise((resolve, reject) => {
      if (this.loaded) {
        resolve(this.countries) // Return already loaded countries data
        return
      }
      fetch(this.settings.jsonDataUrl)
        .then(response => response.json())
        .then(data => {
          // Append new countries that are not already in the countries list
          this.countries = [...this.countries, ...data.filter(item => !this.countries.some(country => country.id === item.id))]
          this.loaded = true // Mark as loaded to prevent redundant fetches
          resolve(this.countries) // Return the loaded countries
        })
        .catch(err => {
          console.log('Error loading countries data:', err)
          reject(false)
        })
    })
  }
}

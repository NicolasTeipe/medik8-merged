export class ProductComparison extends HTMLElement {
  constructor() {
    super()
  }

  rowResize(querySelector) {
    const cells = this.querySelectorAll(querySelector)

    cells.forEach(cell => cell.style.minHeight = '')

    const cellHeights = [...cells].map(cell => cell.getBoundingClientRect().height)
    const maxCellHeight = Math.max(...cellHeights)

    cells.forEach(cell => cell.style.minHeight = `${maxCellHeight}px`)
  }

  updateLayout() {
    const container = this.querySelector('.product-comparison-container')

    container.classList.toggle('hidden', false)

    this.rowResize('.ingredients')
    this.rowResize('.concerns')
    this.rowResize('.types')
    this.rowResize('.benefits')
    this.rowResize('.col-product')

    const grid = this.querySelector('.product-comparison-grid')

    if(grid.scrollWidth <= grid.clientWidth) {
      grid.style.justifyContent = 'center'

      const carousel = this.querySelector('global-carousel')
      if(carousel) {
        const carouselHTML = carousel.innerHTML
        const carouselParent = carousel.parentElement
  
        carousel.remove()
        carouselParent.innerHTML = carouselHTML
      }
    }
  }

  dateCheck() {
    const { start_date, end_date } = this.settings.dateSettings
    const today = new Date()
    const start = new Date(start_date)
    const end = new Date(end_date)

    return (today < end && today > start)
  }

  connectedCallback() {
    DomReadyPromise().then(() => {
      let template = this.querySelector(':scope > template');
      this.settings = JSON.parse(template.innerHTML)

      if (this.settings.dateSettings.enabled) {
        if (this.dateCheck()) {
          this.updateLayout()
        } else {
          this.remove()
          return
        }
      } else {
        this.updateLayout()
      }

      window.addEventListener('resize', () => {
        this.updateLayout()
      })
    })
  }
}

if (!customElements.get('product-comparison')) {
  customElements.define('product-comparison', ProductComparison)
}
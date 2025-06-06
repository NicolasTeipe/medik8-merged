import { EmblaCarousel, EmblaCarouselAutoplay } from '../embla'

export class CartMessageBar extends HTMLElement {
  constructor() {
    super()
  }

  /**
   * Called when the element is connected to the DOM.
   * Initializes the component by loading settings and rendering the message bar.
   */
  connectedCallback() {
    DomReadyPromise()
      .then(async () => {
        const template = this.querySelector(':scope > template')
        if (template) {
          try {
            this.settings = JSON.parse(template.innerHTML)
          } catch (err) {
            console.log(err)
          }
          template.remove()
        }

        if (this.settings?.blocks?.length) {
          this.render()
        }
      })
      .catch(err => {
        console.log(err)
      })
  }

  /**
   * Renders the message bar with the settings provided.
   * Initializes the Embla carousel with autoplay functionality.
   */
  async render() {
    this.innerHTML = `
      <div class="js-embla-slider bg-black">
        <div class="embla__container">
          ${this.settings.blocks
            .map(
              ({ text }) =>
                `<div class="embla__slide t-white t-s ls-10 text-center cell-l--d2 cell-r--d2 content-center">
                  ${text.replace(/<a /g, '<a class="no-hover t-white t-ul" ')}
                </div>`,
            )
            .join('')}
        </div>
      </div>
    `
    const globalSideBarCartUi$ = new ObserverLite({ key: 'GlobalSidebar.SidebarCart' })
    const globalSideBarCartUi = await globalSideBarCartUi$.once()
    const sliderContainer = this.querySelector('.js-embla-slider')
    const settings = this.settings

    if (sliderContainer && settings.options) {
      const emblaApi = EmblaCarousel(sliderContainer, settings.options)

      if (settings.plugins) {
        const autoplay = EmblaCarouselAutoplay(settings.plugins.autoplay, emblaApi)

        globalSideBarCartUi.subscribe(({ open }) => {
          if (open !== undefined && open == true) {
            autoplay.play()
          } else if (open !== undefined && open == false) {
            autoplay.pause()
          }
        })
      }
    }
  }
}

customElements.define('cart-message-bar', CartMessageBar)

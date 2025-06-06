export class GlobalVariantSlider extends HTMLElement {
  constructor() {
    super();

    this._menuOption = 0
    this.menuButtons = this.querySelectorAll('.js-gvs-menu-option')
    this.currentCarousel = null;
  }

  connectedCallback() {
    let template = this.querySelector(':scope > template');
    if (template) {
      try {
        this.settings = JSON.parse(template.innerHTML);
      } catch (err) {
        console.log(err);
      }
      template.remove();
      template = null;
    }

    this.init();
  }

  init() {
    this.menuButtons.forEach(m => {
      m.addEventListener('click', (e) => {
        this.menuOption = Number(e.target.dataset.idx)
      })
    })

    this.buildVariantSlider()
  }

  get menuOption() {
    return this._menuOption
  }

  set menuOption(value) {
    this._menuOption = value;
    this.menuButtons.forEach(m => {
      const idx = Number(m.dataset.idx)
      m.classList.toggle('group-active', idx === this._menuOption)
    })
    this.buildVariantSlider()

    setTimeout(()=>{  
      _swat.initializeActionButtons('global-variant-slider')
      // Applied on the homepage page on user click, 
      // extra checks are unnecessary.
      if(window.yotpoWidgetsContainer) {
        window.yotpoWidgetsContainer.initWidgets()
      }
    }, 0)
  }

  buildVariantSlider() {
    if (this.currentCarousel) {
      this.currentCarousel.destroy();
      this.currentCarousel = null;
    }

    const variantData = this.settings.VariantMetaObjects[this._menuOption].variantList

    const variantProductCards = variantData.map(v => {
      return `
        <global-product-card 
          class="cell-r--d2">
          <template>
            {
              "product":${JSON.stringify(v)},
              "translations": ${JSON.stringify(this.settings.translations)}
            }
          </template>
        </global-product-card>
      `
    }).join('') 

    const variantSlider = `
      <global-carousel class="block-oh block-rel">
        <template>
          {
            "options":{ 
              "loop": false,
              "skipSnaps": true
            },
            "plugins":{
              "scrollbar":{},
              "nav": {
                "nextBtn": ".gvs__nav--next",
                "prevBtn": ".gvs__nav--prev"
              }
            }
          }
        </template>

        <div class="block-grid global-carousel__items global-carousel__items--overflow-visibile">
          <div class="global-carousel__container">
            ${variantProductCards}
          </div>
          <div class="global-carousel__scrollbar gvs-slider__scrollbar--small"></div>
          <button aria-label="Previous slide" class="js-gvs__prev gvs__nav gvs__nav--prev">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9.99999 6.69225L15.3077 12L9.99999 17.3078L9.29224 16.6L13.8922 12L9.29224 7.4L9.99999 6.69225Z" fill="black"/>
            </svg>
          </button>
          <button aria-label="Next slide" class="js-gvs__next gvs__nav gvs__nav--next">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9.99999 6.69225L15.3077 12L9.99999 17.3078L9.29224 16.6L13.8922 12L9.29224 7.4L9.99999 6.69225Z" fill="black"/>
            </svg>
          </button>
        </div>
      </global-carousel>
    `

    this.querySelector('.gvs-slider').innerHTML = variantSlider

    this.currentCarousel = this.querySelector('.gvs-slider global-carousel');
  }
}


if (!customElements.get('global-variant-slider')) {
  customElements.define('global-variant-slider', GlobalVariantSlider)
}


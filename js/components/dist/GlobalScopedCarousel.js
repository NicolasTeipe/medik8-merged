import { EmblaCarousel , EmblaCarouselAutoplay ,  EmblaCarouselScrollbar , EmblaNav} from '../../embla';
/* Example 
  
  <global-carousel>
    - options passed as template. "options" = embla nav params (https://www.embla-carousel.com/api/options/)
    - embla uses existing CSS for sizing, e.g. you don't need to pass "slidesPerView" or something like that
    - you can use existing CSS class. i have added markup that is usefull for using a item/gap/peek approach (see "flex-item-grid" in global.css)
    <template>
      {
        "options":{ 
          "loop": false,
          "skipSnaps": true
        },
        "plugins":{
          "autoplay":{
            "delay":500
          },
          "scrollbar":{},
          "nav":{}
        }
      }
    </template>
    <div class="block-grid block-grid--f global-carousel__items global-carousel__items--overflow-visibile">
      <div class="global-carousel__container">
        <div class="global-carousel__slide">...</div>
      </div>
    </div>
     
    // PLUGINS - outside global-carousel__items, inside component element
    <button aria-label="Next slide" class="global-carousel__nav-next"></button>
    <button aria-label="Prev slide" class="global-carousel__nav-prev"></button>
    <div class="global-carousel__pagination"></div>
    <div class="global-carousel__scrollbar"></div>
  </global-carousel>
*/

export class GlobalCarousel extends HTMLElement {
  constructor() {
    super()

    this.embla = null;
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }

  connectedCallback() {
    DomReadyPromise().then(async () => {
      this.ObserverLite = new ObserverLite()
      let settingsTemplate = this.querySelector(':scope > template')
      if (settingsTemplate) {
        try {
          this.settings = JSON.parse(settingsTemplate.innerHTML)
        } catch (err) {
          console.error(err)
        }
        settingsTemplate.remove()
        settingsTemplate = null
      }

      this.init()
    }).catch(err => {
      console.error(err)
    })
  }

  init(){
    if (this.settings?.options && this.querySelector('.global-carousel__items')) {
      this.embla = new EmblaCarousel(
        this.querySelector('.global-carousel__items'),
        this.settings.options
      )
    }

    if(this.settings?.plugins){
      const plugins = {
        autoplay:EmblaCarouselAutoplay,
        nav:EmblaNav,
        scrollbar:EmblaCarouselScrollbar
      }

      Object.keys(this.settings.plugins).forEach(key => {
        /* plugin options 

        autoplay:{
          delay:INT, milleseconds
        }

        scrollbar:{
          target:string, class/id 
        }

        nav:{
          dotsNode:string, class/id,
          nextBtn:string, class/id,
          prevBtn:string, class/id,
        }

        */
        const settings =  this.settings.plugins[key]
        if(key == 'scrollbar'){
          settings.target = settings.target ?
            this.querySelector(settings.target) :
            this.querySelector('.global-carousel__scrollbar')
        }
        if(key == 'nav'){
          settings.dotsNode = settings.dotsNode ?
            this.querySelector(settings.dotsNode) :
            this.querySelector('.global-carousel__pagination')
          settings.nextBtn = settings.nextBtn ?
            this.querySelector(settings.nextBtn) :
            this.querySelector('.global-carousel__nav-next')
          settings.prevBtn = settings.prevBtn ?
            this.querySelector(settings.prevBtn) :
            this.querySelector('.global-carousel__nav-prev')
        }

        const plugin = plugins[key](
          settings,
          this.embla
        )

        this.plugins = this.plugins || []
        this.plugins.push(plugin)

      })
    }

    const dispatchInitialisation = (compId, interval = 150, maxRetries = 15) => {
      const eventName = `component-initialisation-${compId}`;
      const confirmEventName = `initialisation-confirmed-${this.dataset.compId}`;
      let attempts = 0;
      let initialised = false;

      const confirmHandler = () => {
        initialised = true;
        document.removeEventListener(confirmEventName, confirmHandler);
        clearInterval(intervalId);
      };

      document.addEventListener(confirmEventName, confirmHandler);

      const intervalId = setInterval(() => {
        if (initialised || attempts >= maxRetries) {
          clearInterval(intervalId);
          if (!initialised) {
            console.warn(`Initialisation for ${eventName} failed after ${maxRetries} attempts`);
          }
          return;
        }

        document.dispatchEvent(new CustomEvent(eventName));
        attempts++;
      }, interval);

      document.dispatchEvent(new CustomEvent(eventName));
      attempts++;
    };

    dispatchInitialisation(this.dataset.compId);

    this.next({init:true})
  }

  destroy() {
    if (this.embla) {
      this.embla.destroy();
      this.embla = null;
    }
  }
}

const componentId = document.currentScript.dataset.compId;
const componentName = `global-carousel-${componentId}`;
if (!customElements.get(componentName)) {
  customElements.define(componentName, GlobalCarousel);
}

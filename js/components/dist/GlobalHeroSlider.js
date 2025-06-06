// deps [parseHTML,ObserverLite,DomReadyPromise] loaded globally

export class GlobalHeroSlider extends HTMLElement{
  constructor() {
    super();
  }

  connectedCallback() {
    document.addEventListener(`component-initialisation-${this.dataset.compId}`, async () => {
      document.dispatchEvent(new CustomEvent(`initialisation-confirmed-${this.dataset.compId}`))

      this.GlobalHotspotObserver = new ObserverLite({ key: 'Global.HotspotEvents' });

      let template = this.querySelector(':scope > template')
      if(template){
        try{
          this.settings = JSON.parse(template.innerHTML)
        }
        catch(err){
          console.log(err)
        }
        template.remove()
        template = null
      }

      const componentName = `global-carousel-${this.dataset.compId}`
      const carousel = this.querySelector(componentName)
      
      await carousel.ObserverLite.once()
      this.emblaApi = carousel.embla
      this.engine = this.emblaApi.internalEngine()

      this.controls = this.querySelector('.global-hero-slider__controls')
      this.controlsColors = carousel.dataset.controlsColors.split(',')
      this.playButton = this.querySelector('.js-ghs__play')
      const autoplay = carousel.plugins?.find(({type}) => type == 'autoplay')
      let userPausedAutoPlay = false

      const updatePlayButtonIcon = () => {
        if (autoplay) {
          this.playButton.classList.toggle('global-carousel-nav-btn--paused', userPausedAutoPlay)
          this.playButton.classList.toggle('global-carousel-nav-btn--play', !userPausedAutoPlay)
        }
      }

      const pauseAutoPlay = () => {
        autoplay.pause()
        updatePlayButtonIcon()
      }

      /* 
        If the “next” or "previous" button is clicked and autoplay isn’t 
        paused, pause it invisibly to prevent transition jitter.
      */
      const invisiblePauseAutoPlay = () => {
        if(autoplay) autoplay.pause()
      }

      if(autoplay && this.playButton){
        this.playButton.addEventListener('click', () => {
          userPausedAutoPlay = !userPausedAutoPlay
          
          if(userPausedAutoPlay) {
            autoplay.pause()
          } else {
            autoplay.play()
          }

          updatePlayButtonIcon()
        });
      }

      Array.from(['init', 'reInit', 'scroll','settle']).forEach(event =>
        this.emblaApi.on(event, () => {
          this.updateCounter()
        })
      )

      this.updateCounter()

      this.emblaApi.on('settle', () => {
        const currentSlide = this.engine.index.get()
        const allSlides = this.querySelectorAll('.global-carousel__slide')
        const slideDelay = Number(allSlides[currentSlide].dataset.slideDelay)
        autoplay.setDelay(slideDelay)
  
        // Embla would autoplay on swipe or next/prev click
        // Make sure it stays paused if we have clicked pause
        if (autoplay && autoplay.paused && userPausedAutoPlay) {
          pauseAutoPlay()
        }
      })

      this.nextButton = this.querySelector('.js-ghs__next')
      this.prevButton = this.querySelector('.js-ghs__prev')

      this.nextButton?.addEventListener('click',(e) => {
        e.preventDefault()
        this.emblaApi.scrollNext()
        invisiblePauseAutoPlay()
      })

      this.prevButton?.addEventListener('click',(e) => {
        e.preventDefault()
        this.emblaApi.scrollPrev()
        invisiblePauseAutoPlay()
      })

      this.GlobalHotspotObserver.subscribe(({ event }) => {
        if (event === 'show' && autoplay && !autoplay.paused) {
          pauseAutoPlay()
        }
      })
    });
  }

  updateCounter(){
    this.count = this.count || this.querySelector('.js-ghs__count')

    // Prevent errors for single slide carousel
    if(this.count == null) return;

    const total = this.emblaApi.slideNodes().length
    const current = this.emblaApi.selectedScrollSnap();

    if (this.count) {
      this.count.innerText = `${current + 1} / ${total}`
    }

    // update carousel controls colour
    const [desktopColour, mobileColour] = this.controlsColors[current].split('');
    const colorsMediaQuery = window.matchMedia('(min-width: 768px)');
    if (this.controls && this.controls.style) {
      this.controls.style.filter = `invert(${
        colorsMediaQuery.matches ? desktopColour : mobileColour
      })`;
    }
  }
}

const componentId = document.currentScript.dataset.compId;
const componentName = `global-hero-slider-${componentId}`;
if (!customElements.get(componentName)) {
  customElements.define(componentName, GlobalHeroSlider);
}

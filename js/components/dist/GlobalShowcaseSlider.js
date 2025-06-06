export class GlobalShowcaseSlider extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    DomReadyPromise()
      .then(async () => {
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

        this.maxScaleFactor = 1.5;
        this.slidesCtaBlockContent = this.settings.slidesCtaBlockContent;
        this.animateOnDrag = this.settings.features.animateOnDrag;
        this.sliderContainer = this.querySelector('.gss__carousel');
        this.ctaBlock = this.querySelector('.gss-cta-block');

        const carousel = this.querySelector('global-carousel');
        await carousel.ObserverLite.once();
        this.emblaApi = carousel.embla;

        this.emblaApi.on('reInit', () => {
          this.emblaReInit();
        });

        this.emblaApi.on('scroll', e => {
          this.emblaScroll();
        });

        this.emblaApi.on('select', () => {
          this.emblaSelect();
        });

        this.initNavButtons();
        this.setCarouselContainerHeight();
        this.updateSlides();

        if (!this.sliderCanLoop()) this.duplicateSlides();
      })
      .catch(err => {
        console.log(err);
      });
  }

  /**
   * Reinitializes the carousel height when the slider is reinitialized.
   */
  emblaReInit() {
    this.setCarouselContainerHeight();
  }

  /**
   * Experimental: Updates the slides during scroll based on proximity to the center slide.
   */
  emblaScroll() {
    if (!this.animateOnDrag) return;
    const closestSlide = this.guesstimateClosestSlider(this.emblaApi);
    this.updateSlides(closestSlide);
  }

  /**
   * Updates the slides when a new slide is selected.
   */
  emblaSelect() {
    this.updateSlides();
  }

  /**
   * Initializes the navigation buttons and their click events for scrolling.
   */
  initNavButtons() {
    this.nextButton = this.querySelector('.js-gss__next');
    this.prevButton = this.querySelector('.js-gss__prev');

    this.nextButton?.addEventListener('click', () => {
      this.emblaApi.scrollNext();
    });

    this.prevButton?.addEventListener('click', () => {
      this.emblaApi.scrollPrev();
    });
  }

  /**
   * Get the closest slide index to the current scroll position.
   * @param {object} emblaApi - Embla API instance.
   * @returns {number} The closest slide index
   */
  guesstimateClosestSlider(emblaApi) {
    const scrollProgress = emblaApi.scrollProgress();
    const scrollSnapList = emblaApi.scrollSnapList();

    const closestIndex = scrollSnapList.reduce(
      (closest, currentSnap, index) => {
        const currentDistance = Math.abs(currentSnap - scrollProgress);
        const closestDistance = Math.abs(
          scrollSnapList[closest] - scrollProgress
        );
        return currentDistance < closestDistance ? index : closest;
      },
      0
    );

    return closestIndex;
  }

  /**
   * Checks if the slider can loop.
   * @returns {boolean} Returns false if not enough slides to fill the container.
   */
  sliderCanLoop() {
    return this.emblaApi.internalEngine().slideLooper.canLoop();
  }

  /**
   * Updates the slide states and content.
   * @param {number|null} slideIdx - Index of the active slide, or null to use the selected slide.
   */
  updateSlides(slideIdx = null) {
    const slides = this.querySelectorAll('.gss__slide');
    const slidesCount = slides.length;
    const activeSlideIdx = slideIdx || this.emblaApi.selectedScrollSnap();

    const distances = [];
    for (let i = 0; i < slidesCount; i++) {
      let distance = Math.abs(i - activeSlideIdx);

      if (distance > slidesCount / 2) distance = slidesCount - distance;

      distances.push(distance);
    }

    slides.forEach((slide, idx) => {
      const distance = distances[idx];
      slide.dataset.distance = distance;
    });

    // build slide text
    this.buildCtaBlock(activeSlideIdx, this.ctaBlock);
  }

  /**
   * Builds the CTA block with the slide-specific content.
   * @param {number} slideIdx - Index of the active slide.
   * @param {HTMLElement} ctaBlock - Block element to update the content.
   */
  buildCtaBlock(slideIdx, ctaBlock) {
    ctaBlock.innerHTML = `
      <div class="gss-cta-block__heading row--d2 ">${this.slidesCtaBlockContent[slideIdx].heading}</div>
      <div class="gss-cta-block__subheading row--d2 t-s">${this.slidesCtaBlockContent[slideIdx].subheading}</div>
      <div class="flex justify-center">
        <a href="${this.slidesCtaBlockContent[slideIdx].buttonUrl}" class="v2-btn v2-btn--white f-w500 t-ucase t-xxs">
          ${this.slidesCtaBlockContent[slideIdx].buttonText}
        </a>
      </div>
    `;
  }

  

  /**
   * Sets the height of the carousel container based on the scaled height of the slides.
   */
  setCarouselContainerHeight() {
    const slideHeightScaled =
      Number(
        this.querySelector('.global-carousel__container .gss__slide img')
          .offsetHeight
      ) * this.maxScaleFactor;

    this.sliderContainer.style.height = `${slideHeightScaled}px`;
  }

  /**
   * Duplicates slides for non-looping sliders and reinitializes the Embla API.
   */
  duplicateSlides() {
    const slideContainer = this.querySelector('.gss__carousel');
    const clonedContents = slideContainer.cloneNode(true).innerHTML;
    slideContainer.insertAdjacentHTML('beforeend', clonedContents);
    this.slidesCtaBlockContent = [
      ...this.slidesCtaBlockContent,
      ...this.slidesCtaBlockContent,
    ];

    this.emblaApi.reInit();
    if (!this.sliderCanLoop()) this.duplicateSlides();

    this.updateSlides();
  }
}

if (!customElements.get('global-showcase-slider')) {
  customElements.define('global-showcase-slider', GlobalShowcaseSlider);
}

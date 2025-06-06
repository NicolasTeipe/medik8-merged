// deps { ObserverLite, parseHTML, DomReadyPromise, GlobalCart } loaded globally

// todo, need to see if this plays nice on IOS / add touch events etc .... depending on time i might just replace with a keenslider / carousell instance! 
class NiceScrollSlider{
  constructor({slides,nicescroller}){
    this.nicescroller = nicescroller
    this.slides = slides
    this.slides[0].dataset.nicescrollActive = true
    this.activeIndex = 0
  }

  goToNextSlide(){
    let nextSlide = this.activeIndex + 1
    nextSlide = nextSlide > this.slides.length - 2 ? 0 : nextSlide
    this.activeIndex = nextSlide
    this.animate()
  }

  goToPrevSlide(){
    let prevSlide = this.activeIndex - 1
    prevSlide = prevSlide >= 0 ? prevSlide : this.slides.length - 1
    this.activeIndex = prevSlide
    this.animate()
  }

  animate(){
    let activeSlide = false
    this.slides.forEach( (el,index) => {
      el.dataset.nicescrollActive = index == this.activeIndex ? true : false
      if(this.activeIndex == index){
        activeSlide = el
      }
    })

    const activeSlideX = this.nicescroller.getBoundingClientRect().x - activeSlide.getBoundingClientRect().x
    this.nicescroller.scrollBy({
      left: 0 - activeSlideX,
      top: 0,
      behavior: 'smooth'
    })
  }
}


export class NiceScroll extends HTMLElement {
  constructor() {
    super();
    this.moving = false
  }

  connectedCallback() {
    DomReadyPromise().then( () => {
      if(!this.mounted){
        this.id =  Math.floor(Math.random()*999999999999999)
        const {slideTarget,showControls,hideScrollBar} = this.attributes
        this.slideTarget = slideTarget?.value || false
        this.showControls = showControls ? true : false
        this.hideScrollBar = hideScrollBar ? true : false 
        this.mounted = true
        this.style.userSelect = 'none'
        this.resizeTimeout = `resizeTimeout_${this.id}`
        this.mount()
        this.build()
        this.bind()
      }
    })
  }

  mount(){
    if(!window.NiceScrollMounted){
      const style = `
        <style type="text/css">

          nice-scroll{
            display:block;
            max-width: 100%;
            overflow: hidden;
          }

          .nice-scroll--has-controls{
            position:relative;
          }

          .nice-scroll--scrollbar-active{
            padding-bottom: var(--gutter-unit);
          }

          .nice-scroll__content{
            overflow-x: auto;
            overflow-y:hidden;
            display:block;
            width:100%;
            padding-bottom:16px;
          }

          .nice-scroll__content .arrow{
            display:none;
            top:calc(50% - 8px);
            transform:translate(80%,-50%);
          }

          .nice-scroll__content .arrow--left{
            transform:translate(-80%,-50%);
          }

          .nice-scroll__content label{
            position: relative;
          }

          .nice-scroll__content label input{
            width:100%;
            height:100%;
            top:0;
            left:0;
            margin:0;
          }

          .nice-scroll__content::-webkit-scrollbar {
            width: 50%;
            height:5px;
          }

          .nice-scroll__content::-webkit-scrollbar-track {
            background: #eee;
          }

          .nice-scroll__content::-webkit-scrollbar-thumb {
            background: #000;
          }
  
          .nice-scroll__content::-webkit-scrollbar-thumb:hover {
            background: #000;
          }

          .nice-scroll__content--no-scrollbar{
            padding-bottom:0;
          }

          .nice-scroll__content--no-scrollbar::-webkit-scrollbar {
            display:none;
          }

          .nice-scroll__content--no-scrollbar .arrow{
            top:50%;
          }

        </style>
      `
      window.NiceScrollMounted = true
      document.body.append(parseHTML(style))
    }
  }

  build(){
    this.innerHTML = `
      <div class="nice-scroll__content" data-nicescroll-content>
        ${this.innerHTML}
      </div>
    `
    this.content = this.querySelector('[data-nicescroll-content]')
    if(this.hideScrollBar){
      this.content.classList.add('nice-scroll__content--no-scrollbar')
    }

    const slides = this.slideTarget = this.querySelectorAll(this.slideTarget) || this.querySelectorAll('[data-nicescroll-slide]')

    if(!slides?.length || !this.showControls){
      return
    }

    // uses arrow class defined by wayfx
    this.classList.add('nice-scroll--has-controls')
    this.content.append(parseHTML(
      `
      <button class="arrow arrow--left"  data-nicescroll-slide-prev aria-label="Previous item"></button>
      <button class="arrow arrow--right" data-nicescroll-slide-next aria-label="Next item"></button>
      `
    ))
    this.controls = {
      prev:this.querySelector('[data-nicescroll-slide-prev]'),
      next:this.querySelector('[data-nicescroll-slide-next]')
    }

    this.slider = new NiceScrollSlider({slides:slides,nicescroller:this.content})

  }

  toggleControls(){
    clearTimeout(this.resizeTimeout)
      this.resizeTimeout = setTimeout(() => {
        const {width} = this.content.getBoundingClientRect()
        const show = Math.floor(width) < this.content.scrollWidth
        this.controls.prev.style.display = show ? 'block' : 'none'
        this.controls.next.style.display = show ? 'block' : 'none'

        if(!this.hideScrollBar){
          this.classList.toggle('nice-scroll--scrollbar-active', show)
        }

      }, 500)
  }

  bind(){
    
    if(this.slider){
      this.controls.prev.addEventListener('click',(e) => {
        e.preventDefault(
          this.slider.goToPrevSlide()
        )
      })

      this.controls.next.addEventListener('click',(e) => {
        e.preventDefault(
          this.slider.goToNextSlide()
        )
      })

      new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentBoxSize) {
            this.toggleControls()
          }
        }
      })
      .observe(this.content)

    }


    let isDown = false;
    let startX, scrollLeft;
    const scrollMultiplier = 1
    
    const resetCursorAndMouseDownState = () => {
      isDown = false;
      this.content.style.cursor = 'grab';
    }
      
    this.content.addEventListener('mousedown', (e) => {
      isDown = true;
      this.content.style.cursor = 'grabbing';
      startX = e.pageX - this.content.offsetLeft;
      scrollLeft = this.content.scrollLeft;
    });

    this.content.addEventListener('mouseleave', resetCursorAndMouseDownState);
    this.content.addEventListener('mouseup', resetCursorAndMouseDownState);

    this.addEventListener('mousemove', (e) => {
      if(!isDown) return;
      e.preventDefault();
      const x = e.pageX - this.content.offsetLeft;
      const walk = (x - startX) * scrollMultiplier;
      this.content.scrollLeft = scrollLeft - walk;
    });

    
  }

 
}
customElements.define('nice-scroll', NiceScroll)
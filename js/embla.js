import EmblaCarousel from 'embla-carousel'

EmblaCarousel.globalOptions = { watchSlides: false }
export {EmblaCarousel}


class ObservableTimeout{
  constructor(delay){
    this.ObserverLite = new ObserverLite()
    this.timeout = false
    this.delay = delay || 5000
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }  

  stop(){
    if(!this?.timeout) {
      return
    }
    clearTimeout(this.timeout)
  }

  go(){
    if(!this){
      return
    }
    this.stop()
    this.timeout = setTimeout(() => {
      this.next()
      this.go()
    }, this.delay)
  }

  setDelay(newDelay) {
    this.delay = newDelay;
    this.go();
  }
}

export function EmblaCarouselAutoplay(options,emblaApi){
  const delay = options?.delay || 5000
  const emblaRoot = emblaApi.rootNode()
  const timer$ = new ObservableTimeout(delay)
  let pause
  let play
  let paused = false

  window.onload = () => {
    timer$.go()
  }

  // Executes on every autoplay click
  timer$.subscribe( () => {
    if (emblaApi.canScrollNext()) {
      emblaApi.scrollNext()
    } else {
      emblaApi.scrollTo(0)
    }
  })

  emblaApi.on('reInit', timer$.go)
  emblaApi.on('pointerUp', timer$.go)
  emblaApi.on('pointerDown', timer$.stop)

  const conditionallyPauseAutoPlay = () => {
    if(!paused){
      timer$.stop()
    }
  }

  const conditionallyResumeAutoPlay = () => {
    if(!paused){
      timer$.go()
    }
  }
  // To prevent jitter, the autoplay timer is paused when swiping on touch.
  emblaRoot.addEventListener('touchstart', conditionallyPauseAutoPlay)
  emblaRoot.addEventListener('touchend', conditionallyPauseAutoPlay)
  emblaRoot.addEventListener('mouseover', conditionallyPauseAutoPlay)

  // If touch is cancelled, resume autoplay if not already paused
  emblaRoot.addEventListener('touchcancel', conditionallyResumeAutoPlay)

  // After manual transition is completed resume autoplay if not paused
  emblaRoot.addEventListener('mouseout', conditionallyResumeAutoPlay)

  // On load, perform an initial carousel hover check to pause the timer
  window.addEventListener('load', () => {
    if (emblaRoot.matches(':hover')) {
      conditionallyPauseAutoPlay()
    }
  })

  pause = () => {
    paused = true
    timer$.stop()
  }

  play = () => {
    paused = false
    timer$.go()
  }

  const setDelay = newDelay => {
    timer$.setDelay(newDelay);
  };

  function destroy(){
    emblaApi.off('init', timer$.go)
    emblaApi.off('reInit', timer$.go)
    emblaApi.off('pointerDown', timer$.stop)
    emblaApi.off('pointerUp', timer$.go)
  }

  const type = 'autoplay'
  return {
    type,
    get paused() {
      return paused
    },
    pause,
    play,
    setDelay,
  }
}

export function EmblaCarouselScrollbar(options = {}, emblaApi) {
  let engine = emblaApi.internalEngine()
  let scrollbarContainer
  let thumb
  let progress = 0
  let factor = 1
  let isDown = false
  let startX = 0
  let thumbLeft = 0


  if (options.target && !engine.options.loop) {
    build()
  }

  function mapToScroll() {
    const { target } = options
    progress = emblaApi.scrollProgress()
    progress = progress > 1 ? 1 : progress < 0 ? 0 : progress
    const maxScroll = target.offsetWidth - thumb.offsetWidth
    thumb.style.transform = `translateX(${maxScroll * progress}px)`
  }

  function build() {
    const { target } = options
    if (!scrollbarContainer && !target.dataset.init) {
      target.dataset.init = true
      scrollbarContainer = document.createElement('div')
      thumb = document.createElement('div')
      scrollbarContainer.appendChild(thumb)
      target.appendChild(scrollbarContainer)
      scrollbarContainer.style.height = '4px'
      scrollbarContainer.style.background = 'rgba(0,0,0,.1)'
      thumb.style.height = '100%'
      thumb.style.background = '#000'
      thumb.style.cursor = 'grab'

      Array.from(['init', 'reInit', 'scroll', 'settle']).forEach(event =>
        emblaApi.on(event, mapToScroll)
      )

      thumb.addEventListener('mousedown', onDragStart)
      thumb.addEventListener('touchstart', onDragStart, { passive: false }) // Prevent default behavior

      scrollbarContainer.addEventListener('click', onScrollbarClick)

      updateSize()
      emblaApi.on('resize', (api) => {
        emblaApi = api
        engine = api.internalEngine()
        updateSize()
      })
    }
  }

  function resetCursorAndMouseDownState() {
    isDown = false
    thumb.style.cursor = 'grab'
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', resetCursorAndMouseDownState)
    document.removeEventListener('mouseleave', resetCursorAndMouseDownState)
    document.removeEventListener('touchmove', onDragMove)
    document.removeEventListener('touchend', resetCursorAndMouseDownState)
    document.body.classList.remove('embla__dragging')
    startX = 0
  }

  function onDragStart(e) {
    e.preventDefault() // Prevent default behavior
    isDown = true
    thumb.style.cursor = 'grabbing'
    startX = (e.pageX || e.touches[0].pageX) - scrollbarContainer.offsetLeft
    thumbLeft = parseInt(thumb.style.transform.replace('translateX(', '').replace('px)', '')) || 0

    document.body.classList.add('embla__dragging')
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', resetCursorAndMouseDownState)
    document.addEventListener('mouseleave', resetCursorAndMouseDownState)
    document.addEventListener('touchmove', onDragMove, { passive: false }) // Prevent default behavior on touch move
    document.addEventListener('touchend', resetCursorAndMouseDownState)
  }

  function onDragMove(e) {
    if (!isDown) return
    e.preventDefault()
    const x = (e.pageX || e.touches[0].pageX) - scrollbarContainer.offsetLeft
    const walk = (x - startX)
    let newThumbLeft = thumbLeft + walk
    const maxThumbLeft = scrollbarContainer.offsetWidth - thumb.offsetWidth
    if (newThumbLeft < 0) newThumbLeft = 0
    if (newThumbLeft > maxThumbLeft) newThumbLeft = maxThumbLeft
    thumb.style.transform = `translateX(${newThumbLeft}px)`
    updateCarouselScrollPosition(newThumbLeft, maxThumbLeft)
  }

  function updateCarouselScrollPosition(newThumbLeft, maxThumbLeft) {
    const snaps = engine.scrollSnaps
    let newProgress = newThumbLeft / maxThumbLeft
    newProgress = newProgress * snaps[snaps.length - 1]
    engine.translate.to(newProgress)
  }

  function onScrollbarClick(e) {
    if (e.target === thumb) return // Ignore clicks directly on the thumb

    const clickPosition = e.pageX - scrollbarContainer.getBoundingClientRect().left
    const thumbWidth = thumb.offsetWidth
    const maxThumbLeft = scrollbarContainer.offsetWidth - thumbWidth

    let newThumbLeft = clickPosition - thumbWidth / 2
    if (newThumbLeft < 0) newThumbLeft = 0
    if (newThumbLeft > maxThumbLeft) newThumbLeft = maxThumbLeft

    thumb.style.transform = `translateX(${newThumbLeft}px)`
    updateCarouselScrollPosition(newThumbLeft, maxThumbLeft)
  }

  function updateSize() {
    const { target } = options
    scrollbarContainer.style.width = '100%'
    const containerNode = emblaApi.containerNode()
    factor = containerNode.scrollWidth / containerNode.offsetWidth
    const thumbWidth = target.offsetWidth / factor
    thumb.style.width = `${thumbWidth}px`

    mapToScroll() // Reposition the thumb correctly after resizing
  }

  const type = 'scrollbar'
  return {
    type
  }
}


export function EmblaNav(options = {},emblaApi){
  if(options.prevBtn && options.nextBtn){
    addPrevNextBtnsClickHandlers()
  }

  if(options.dotsNode){
    addDotBtnsAndClickHandlers()
  }

  function addTogglePrevNextBtnsActive(){
    const togglePrevNextBtnsState = () => {
      if (emblaApi.canScrollPrev()) options.prevBtn.removeAttribute('disabled')
      else options.prevBtn.setAttribute('disabled', 'disabled')
  
      if (emblaApi.canScrollNext()) options.nextBtn.removeAttribute('disabled')
      else options.nextBtn.setAttribute('disabled', 'disabled')
    }
  
    emblaApi
      .on('select', togglePrevNextBtnsState)
      .on('init', togglePrevNextBtnsState)
      .on('reInit', togglePrevNextBtnsState)
  
    return () => {
      options.prevBtn.removeAttribute('disabled')
      options.nextBtn.removeAttribute('disabled')
    }
  }

  function addPrevNextBtnsClickHandlers(){
    const scrollPrev = () => emblaApi.scrollPrev()
    const scrollNext = () => emblaApi.scrollNext()
    options.prevBtn.addEventListener('click', scrollPrev, false)
    options.nextBtn.addEventListener('click', scrollNext, false)
  
    const removeTogglePrevNextBtnsActive = addTogglePrevNextBtnsActive()
    emblaApi.on('destroy', addPrevNextBtnsClickHandlers)
    return () => {
      removeTogglePrevNextBtnsActive()
      options.prevBtn.removeEventListener('click', scrollPrev, false)
      options.nextBtn.removeEventListener('click', scrollNext, false)
    }
  }

  function addDotBtnsAndClickHandlers(){
    let dotNodes = []
  
    const addDotBtnsWithClickHandlers = () => {
      options.dotsNode.innerHTML = emblaApi
        .scrollSnapList()
        .map(() => '<button class="global-carousel__dot" type="button"></button>')
        .join('')
  
      dotNodes = Array.from(options.dotsNode.querySelectorAll('.global-carousel__dot'))
      dotNodes.forEach((dotNode, index) => {
        dotNode.addEventListener('click', () => emblaApi.scrollTo(index), false)
      })
    }
  
    const toggleDotBtnsActive = () => {
      options.dotsNode.style.display =
        !emblaApi.canScrollPrev() && !emblaApi.canScrollNext()
          ? 'none'
          : 'block';

      const previous = emblaApi.previousScrollSnap()
      const selected = emblaApi.selectedScrollSnap()
      dotNodes[previous]?.classList?.remove('global-carousel__dot--selected')
      dotNodes[selected]?.classList?.add('global-carousel__dot--selected')
    }
  
    emblaApi
      .on('init', addDotBtnsWithClickHandlers)
      .on('destroy', addDotBtnsWithClickHandlers)
      .on('reInit', addDotBtnsWithClickHandlers)
      .on('init', toggleDotBtnsActive)
      .on('reInit', toggleDotBtnsActive)
      .on('select', toggleDotBtnsActive)

  
    return () => {
      options.dotsNode.innerHTML = ''
    }
  }

  const type = 'nav'
  return {
    type
  }
}



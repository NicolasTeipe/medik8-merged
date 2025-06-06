// KS SLIDER PLUGIN:NAVIGATION
export function KSnavigation(slider) {
  let wrapper, dots, arrowLeft, arrowRight
  function markup(remove) {
    wrapperMarkup(remove)
    dotMarkup(remove)
    if(!slider.options.hideArrows){
      arrowMarkup(remove)
    }
  }

  function removeElement(elment) {
    if(elment){
      elment.parentNode?.removeChild(elment)
    }
  }

  function createDiv(className) {
    var div = document.createElement("div")
    var classNames = className.split(" ")
    classNames.forEach((name) => div.classList.add(name))
    return div
  }

  function arrowMarkup(remove) {
    if (remove) {
      removeElement(arrowLeft)
      removeElement(arrowRight)
      return
    }
    arrowLeft = createDiv("arrow arrow--left")
    arrowLeft.addEventListener("click", () => slider.prev())
    arrowRight = createDiv("arrow arrow--right")
    arrowRight.addEventListener("click", () => slider.next())

    wrapper.appendChild(arrowLeft)
    wrapper.appendChild(arrowRight)
  }

  function wrapperMarkup(remove) {
    if (remove) {
      var parent = wrapper.parentNode
      while (wrapper.firstChild)
        parent.insertBefore(wrapper.firstChild, wrapper)
      removeElement(wrapper)
      return
    }
    wrapper = createDiv("navigation-wrapper")
    slider.container.parentNode.appendChild(wrapper)
    wrapper.appendChild(slider.container)
  }

  function dotMarkup(remove) {
    if (remove) {
      removeElement(dots)
      return
    }
    if(slider.track.details && isFinite(slider.track.details.maxIdx)){
      dots = createDiv("dots")
      const dotsArray = [ ...Array(slider.track.details.maxIdx + 1).keys() ]
      dotsArray.forEach((_e, idx) => {
        var dot = createDiv("dot")
        dot.addEventListener("click", () => slider.moveToIdx(idx))
        dots.appendChild(dot)
      })
      wrapper.appendChild(dots)

    }
  }

  function updateClasses() {

    if(!slider || !slider.track.details){
      return 
    }

    const navigatonWrapper = slider.container.parentNode.classList.contains('navigation-wrapper') ? slider.container.parentNode : false   
    if(navigatonWrapper){
      const disableWrapperPadding =  !slider.options.slides || slider.slides.length <= slider.options.slides.perView
      navigatonWrapper.classList.toggle('navigation-wrapper--no-padding',disableWrapperPadding)
    }

    var slide = slider.track.details.rel
    if(dots && dots.children.length){
      Array.from(dots.children).forEach(function (dot, idx) {
        idx === slide
          ? dot.classList.add("dot--active")
          : dot.classList.remove("dot--active")
      })
      dots.style.display = slider.slides.length <= slider.options.slides.perView ? 'none' : 'flex'
    }
   
    if(arrowLeft && arrowRight){
      arrowLeft.style.display = !slider.options.slides || slider.slides.length <= slider.options.slides.perView ? 'none' : 'block'
      arrowRight.style.display = !slider.options.slides ||  slider.slides.length <= slider.options.slides.perView ? 'none' : 'block'
      slide === 0
      ? arrowLeft.classList.add("arrow--disabled")
      : arrowLeft.classList.remove("arrow--disabled")
      slide === slider.track.details.slides.length - 1
      ? arrowRight.classList.add("arrow--disabled")
      : arrowRight.classList.remove("arrow--disabled")
    }

  }

  slider.on("created", () => {
    markup()
    updateClasses()
    slider.update()
  })

  slider.on("update", () => {
    updateClasses()
  })

  slider.on("optionsChanged", () => {
    markup(true)
    markup()
    updateClasses()
  })

  slider.on("slideChanged", () => {
    updateClasses()
  })

  slider.on("destroyed", () => {
    markup(true)
  })
}

//KS PLUGGIN: AUTOPLAY

export function KSautoPlay(slider){

  const speed = slider.options.autoplaySpeed || 3000
  let timeout
  let mouseOver = false
  
  function clearNextTimeout() {
    clearTimeout(timeout)
  }

  function nextTimeout() {
    clearTimeout(timeout)
    if (mouseOver) return
    timeout = setTimeout(() => {
      if(slider && slider.track.details && slider.track.details.length){
        slider.next()
      }
    }, speed)
  }

  slider.on('created', () => {
    slider.container.addEventListener('mouseover', () => {
      mouseOver = true
      clearNextTimeout()
    })
    slider.container.addEventListener('mouseout', () => {
      mouseOver = false
      nextTimeout()
    })
    nextTimeout()
  })

  slider.on('dragStarted', clearNextTimeout)
  slider.on('animationEnded', nextTimeout)
  slider.on('updated', nextTimeout)
}

// KS PLUGIN: CENTER CONTENT (centers content when number of slides < number of visible slides)
export function KScenterSlides(slider){

  function update(){
    const overflow = slider.slides.length > slider.options.slides.perView
    if(overflow){
      slider.container.style.justifyContent = 'flex-start'
    }else{
      slider.container.style.justifyContent = 'center'
    }
  }

  let events = ['created','update','optionsChanged','slideChanged','destroyed']
  events.forEach(event => {
    slider.on(event, () => {
      update()
    })
  })

}

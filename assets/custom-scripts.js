
// Cart page loading buttons
$(() => {
  $('body').on('click', '.cart__checkout, .update-cart', function() {
    $(this).css('color', 'transparent').addClass('loading-button')
  })
})

// Country selector dropdown stuff
$(() => {
  $(".wayfx-header__has-dropdown").hover(function() {
    $('.country-selector__dropdown').fadeOut(100)
  })
})


// MOS2 Callout


// password with validation 
class GlobalPasswordInput extends HTMLElement {

  constructor() { 
    super();
    this.id =  Math.floor(Math.random()*999999999999999)
  }

  get defaults() {
    return{
      validationHintText:'Please enter a password between 8 and 40 characters with at least 1 uppercase and 1 lowercase letter',
      inputAttributes:{
        id:'password',
        class:'password-input',
        name:'password',
        pattern:'^(?=.*?[A-Z])(?=.*?[a-z]).{8,40}$',
        placeholder:'Enter your password'
      }

    }
  }

  get valid(){
    return this.regex.test(this.input.value)
  }

  connectedCallback(){
    if(!this.init){
      const {inputAttributes} = this.defaults
      this.init = true
      this.placeholder = this.attributes.placeholder ? this.attributes.placeholder.value : false
      this.validationHintText = this.attributes.validationHintText ? this.attributes.validationHintText.value : false
      this.inputAttributes = {
        id:this.attributes.inputId ? this.attributes.inputId.value : inputAttributes.id,
        class:this.attributes.inputClass ? this.attributes.inputClass.value :  inputAttributes.class,
        name:this.attributes.inputName ? this.attributes.inputName.value : inputAttributes.name,
        pattern:this.attributes.pattern ? this.attributes.pattern.value : inputAttributes.pattern,
        placeholder:this.attributes.inputPlaceholder ? this.attributes.inputPlaceholder.value : inputAttributes.placeholder
      }
      this.regex = new RegExp(this.inputAttributes.pattern)
      this.render()
    }
  }

  renderValidationHint(){
    this.validationHint =  document.createElement('div')
    this.validationHint.style.cssText = "display:none;position:absolute;top:-30px;background:#fff;left:0;width:100%;padding:10px;transform: translate(0, -100%);box-shadow:0 8px 12px rgb(0 0 0 / 25%);font-size:13px;line-height:1.4"
    this.validationHint.innerHTML = this.validationHintText
    this.appendChild(this.validationHint )
  }

  toggleValidationHint(showHint){
    if(!this.validationHint){
      this.renderValidationHint()
    }
    this.validationHint.style.display = showHint ? 'block' : 'none'
  }

  bind(){
    this.input.addEventListener('keyup',() => {
      this.toggleValidationHint(!this.valid && this.input.value.length > 0)
    })

    this.input.addEventListener('change',() => {
      this.toggleValidationHint(!this.valid && this.input.value.length > 0)
    })

  }

  render(){
    this.style.position = 'relative'
    this.input = document.createElement('input')
    this.input.type = 'password'
    this.input.id = this.inputAttributes.id
    this.input.className = this.inputAttributes.class
    this.input.name = this.inputAttributes.name
    this.input.pattern = this.inputAttributes.pattern
    this.input.placeholder = this.inputAttributes.placeholder
    this.input.setAttribute('aria-label',this.input.placeholder)
    this.input.required = true
    this.appendChild(this.input)

    this.toggleViewButton = document.createElement('button')
    this.toggleViewButton.style.cssText = "position:absolute;top:50%;right:10px;width:30px;height:30px;transform: translate(0, -50%);background-position:center;background-size:15px;background-repeat:no-repeat;background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ1IDc5LjE2MzQ5OSwgMjAxOC8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpkNjEyMjY4Mi1kYmY5LTQwNzYtODA4OS1iNDg3Y2EyN2VjZmIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QjNDQTYwNEVFRjM3MTFFOEI1MDlFMjg4NDlCM0IyMjIiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QjNDQTYwNERFRjM3MTFFOEI1MDlFMjg4NDlCM0IyMjIiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo5Y2Q3Y2U3NC1iZGFiLTRjMDgtYTczYS0zMGM0MmMxOGE2MzkiIHN0UmVmOmRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDoyNmU4ZjA0Yy1hMzI5LTFlNGEtOTA2OC1kZTVmNTNkYmFhZTIiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6m0YrRAAABMUlEQVR42sTTvyvEcRzH8c9J4gY/Lou66HKDUgxOBiWG+xsMBnVxix+T1Wyw2tB1ymKRQdQxOQx3oS5JBsVfwMJAX8/39frq6/qyfAfvegzfH+9f9/lezPM8FyWaXMSINVy3YgjTyKIHn3jGGfZwg/ewYr3YVILtVcMqKro2Hygg1bjCIA4whkcl5fCKeKCJFR3Bviath415jUMM4Aoz2Ah09h2hX82sWNIKbGmvTj20fbfxFFLgTuO3a8qi016LmiaBckii7xzdendeufUqlcCD5T8KrOidLlxi12kP2+dEEzRjLSR5HS3owDHu0ef/kMPa7xYTupfBApZ0Ohbjavag0/gRKY1kR3eKPKYwiTmU8KKPKf3bl9imbrMY1bhORavYwQXevgv8+58pcoEvAQYALU9ch/cIiaUAAAAASUVORK5CYII=);"
    this.toggleViewButton.type = 'button'
    this.toggleViewButton.setAttribute('aria-label', 'Show/Hide Password')
    this.toggleViewButton.onclick = () => this.input.type = this.input.type == 'text' ? 'password' : 'text'
    this.appendChild(this.toggleViewButton)
    
    this.bind()
    this.input.dispatchEvent(new Event('change'))
  }

}

customElements.define('global-password-input', GlobalPasswordInput);
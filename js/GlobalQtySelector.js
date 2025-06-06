// deps { ObserverLite, parseHTML, DomReadyPromise } loaded globally
export class GlobalQtySelector extends HTMLElement {

  constructor() {
    super();
    this.ObserverLite = new ObserverLite()
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }

  connectedCallback() {
    DomReadyPromise().then( () => {
      if(!this.mounted){
        this.mount()
      }
    }).catch(err => {
      console.log(err)
    })
  }

  update(math){
    const {input} = this
    const a = parseInt(input.value),
          p1 = a + 1,
          m1 = a - 1,
          min = input.min || 0,
          max = input.max || Infinity
                 
    if(math == 'add' && p1 <= max){
      input.value = p1
    }
    if(math == 'remove' && m1 >= min){
      input.value = m1
    }
    // debounce the subscriber so we don't run after every click
    clearTimeout(this.timeoutId)
    this.timeoutId = setTimeout(() => {
      this.next()
      input.dispatchEvent(new Event('change'))
    }, 500)
  }

  mount(){
    this.mounted = true
    if(!window.GlobalQtySelectorStylesInjected){
      const style = `
        <style type="text/css">
          global-qty-selector{
            --elementSize:40px;
            display:flex;
          }

          .qty-selector-disabled{
            opacity:0.2;
            pointer-events:none;
          }

          .qty-selector__btn{
            width:var(--elementSize);
            height:var(--elementSize);
            border:1px solid #666;
            color:#000;
            outline:none;
            border-radius:5px;
            transition: all .1s ease-in;
            position:relative;
          }

          .qty-selector__btn:hover{
            background:#000;
            border-color:#000;
            color:#fff;
          }

          .qty-selector__btn:after{
            content:'+';
            position:absolute;
            top:50%;
            left:50%;
            transform:translate(-50%,-50%);
            font-size:20px;
          }
          
          .qty-selector__btn--dec:after{
            content:'-';
          }

          input.qty-selector__input{
            width:var(--elementSize);
            height:var(--elementSize);
            border:0px;
            outline:0px;
            pointer-events:none;
            padding:2px;
            margin:0;
            text-align:center;
          }
        </style>
      `
      window.GlobalQtySelectorStylesInjected = true
      document.body.append(parseHTML(style))
    }
    const increaseButton = parseHTML('<button class="js-qty-selector__btn--inc btn-reset qty-selector__btn qty-selector__btn--inc" aria-label="Add Item" type="button"></button>')
    const descreaseButton = parseHTML('<button class="js-qty-selector__btn--dec btn-reset qty-selector__btn qty-selector__btn--dec" aria-label="Remove Item" type="button"></button>')
    this.prepend(descreaseButton)
    this.append(increaseButton)

    this.increase = this.querySelector('.js-qty-selector__btn--inc')
    this.decrease = this.querySelector('.js-qty-selector__btn--dec')
    this.input = this.querySelector('input')

    this.input.classList.add(...['qty-selector__input','reset-input'])
    this.input.setAttribute('readonly',true)
    this.input.setAttribute('type','text')

    this.increase.addEventListener('click',() => {
      this.update('add')
    })

    this.decrease.addEventListener('click',() => {
      this.update('remove')
    })
  }

}
customElements.define('global-qty-selector', GlobalQtySelector);
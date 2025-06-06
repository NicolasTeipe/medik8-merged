// deps { ObserverLite, parseHTML, DomReadyPromise, GlobalCart } loaded globally

export class GlobalCartProgressBarTiersProducer{
  constructor(){
    return new Promise( async (resolve,reject) => {
      const singleton$ = new ObserverLite({key:'GlobalCartProgressBarTiersProducer$'})
      singleton$.once().then( (instance) => {
        resolve(instance)
      })
      if(!singleton$.onceDone){
        this.dynamic = []
        this.static = []
        this.ObserverLite = new ObserverLite()
        singleton$.next(this)
      }
    })
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }
}

export class GlobalCartProgressBar extends HTMLElement {

  constructor() {
    super();
    this.ObserverLite = new ObserverLite()
    this.settings = {}
    this.tiers = false
  }

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }

  connectedCallback() {
    DomReadyPromise().then( async () => {
      await this.mount()
      // create a method to subscribe to a specific instance using an observer_key
      const observer_key = this.attributes?.observer_key?.value || false
      if(observer_key){
        const observer$ = new ObserverLite({key:observer_key})
        this.ObserverLite.subscribe( (data) => {
          observer$.next(data)
        })
      }

      this.tiersProducer = await new GlobalCartProgressBarTiersProducer()
      this.globalcart = this.globalcart || await new GlobalCart()

      this.tiersProducer.subscribe( () => {
        this.render()
      })

      this.globalcart.subscribe( () => {
        this.render()
      })
      
      this.render()
    }).catch(err => {
      console.log(err)
    })
  }

  async getTiers(){
    let dynamicTiers = await Promise.all(this.tiersProducer.dynamic)
    dynamicTiers = dynamicTiers.flat()
    return [
      ...this.tiersProducer.static,
      ...dynamicTiers
    ].filter( tier => tier )
  }

  set progressBarWidth(value) {
    this.style.setProperty('--progress-bar-width', value);
  }

  set progressItemWidth(value) {
    this.style.setProperty('--progress-bar-item-width', value);
  }

  mount(){
    return new Promise( (resolve,reject) => {
      if(window.GlobalCartProgressBarMounted){
        resolve()
      }else{
        window.GlobalCartProgressBarMounted = true
        const style = `
          <style type="text/css">
            :host { 
              --progress-bar-width:0%;
            }
            :root{
              --progress--color-primary: #000000;
              --progress--color-secondary: #6e6e6e;
            }
            global-cart-progress-bar{
              padding-top:Var(--gutter-unit);
              padding-bottom:var(--gutter-unit);
            }
            global-cart-progress-bar[hidden="true"]{
              display:none;
            }
            
            .cart-progress-bar__bar{
              width:100%;
              height:24px;
              position:relative;
              background:#a1a1a1;
              border-radius: 12px;
              overflow:hidden;
            }
            
            .cart-progress-bar--small .cart-progress-bar__bar{
              height:20px;
            }
            .cart-progress-bar__bold{
              font-family: ridley_groteskbold,sans-serif;
            }
            .cart-progress-bar__bar:after {
              transition:width 1000ms ease-out;
              content:'';
              position:absolute;
              background: url(https://cdn.medik8.com/f3b762a8-adbe-4f3f-8425-97b09363b2de/diagnol.png) repeat-x center top/contain,linear-gradient(270deg,var(--progress--color-primary) 0%,var(--progress--color-secondary) 35%,var(--progress--color-primary) 100%);
              border-radius: 0 15.5px 15.5px 0;
              height:100%;
              width: var(--progress-bar-width);
            }
            
            .cart-progress-bar__item{
              padding:var(--gutter-unit-d3) 0 0 var(--gutter-unit-d2);
              width:var(--progress-bar-item-width);
              text-align:right;
              font-family: ridley_groteskmedium,sans-serif;
              font-size:var(--t-xs);
            }
            .cart-progress-bar__item[data-threshold="0"]{
              text-align:left;
            }
            .cart-progress-bar__item:before{
              width:24px;
              height:24px;
              top:0;
              right:0;
              position:absolute;
              content:'';
              border-radius:100%;
              transform:translate(0%,-100%);
              background-color:#fff;
              background-position:center;
              background-repeat:no-repeat;
              background-size: 13px;
              background-image: url(data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDMyIDMyIiB3aWR0aD0iNTEyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KICAgIDxwYXRoIGZpbGw9IiNhMWExYTEiIGQ9Im0yNiAxNGgtM3YtNWE3IDcgMCAwIDAgLTE0IDB2NWgtM2EuOTk5NzQuOTk5NzQgMCAwIDAgLTEgMXYxNGEuOTk5NzQuOTk5NzQgMCAwIDAgMSAxaDIwYS45OTk3NC45OTk3NCAwIDAgMCAxLTF2LTE0YS45OTk3NC45OTk3NCAwIDAgMCAtMS0xem0tMTUtNWE1IDUgMCAwIDEgMTAgMHY1aC0xMHoiIC8+DQo8L3N2Zz4NCg==)
            }
            .cart-progress-bar__item[data-threshold="0"]:before{
              right:auto;
              left:0;
            }
            .cart-progress-bar--small .cart-progress-bar__item:before{
              height:20px;
              width:20px;
              background-size: 11px;
            }
            .cart-progress-bar__item[data-active]:before{
              background-color:#000;
              background-size: 15px;
              background-image: url(data:image/svg+xml;base64,DQo8c3ZnIGlkPSJhYjIxYjQ5NS0xNTUyLTRmYTEtOTFhMi1iNWZjYjMyM2Y0NTEiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgNjQgNjQiIHdpZHRoPSI1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iI2ZmZiIgZD0ibTIxLjYzMzUgNDcuMTg2NGMtMS44OTI3LTIuMTI2NC0zLjQyMTYtNC4yMDY0LTQuODk4NS02LjIyMDhhMzUuNDY3IDM1LjQ2NyAwIDAgMSAtMy40OTQzLTUuODQ0OGMtLjYxLTEuMjQ3NC0uODgtMi41MTA1LjQ0MTMtMy4zMjI2IDMuNzg2Ny0yLjMyNzEgNC41NjI3LS4xMDUxIDYuNjIwOSAyLjQ3MzEgMS4yMiAxLjUyNzcgMy4wMTkgNC4wNDY5IDQuMTQ2MiA1LjYzODYgMS4wNzY3IDEuNTIgMi4zODkzLTEuMjIzNCAyLjkxMzMtMS45OTc1IDEuODYyNC0yLjc1MTEgNi43MDI5LTkuNDg2MyA4LjcwMzItMTEuOTc1OSAxLjg5OS0yLjM2MzQgOC4wMjg1LTguOTg0NCA5LjE3MTEtMTAuMDM3NS45NzI2LS44OTY3IDMuMDI2MS0yLjg2MzUgNC40MDctMS43Nzg1IDEuNDUxMSAxLjE0IDIuMTYgMy4zMDcgMS4xNCA0LjcxNi0xLjc3NjQgMi40NTMtNC41NjY3IDQuNzg2NS02LjQ5NzQgNy4xMjIyLTMuOTA4MiA0LjcyOC03LjYwODMgOS44MjQ0LTExLjE2IDE0Ljg5ODgtMS4yMDY5IDEuNzI0NC0yLjkwMTQgNC42MTI1LTMuOTUzNCA2LjQ4MjYtMS45Njc5IDMuNDk4NS0zLjY5NjQgNC4xNjQzLTcuNTM5NC0uMTUzN3oiLz48L3N2Zz4=);
            }
            .cart-progress-bar--small .cart-progress-bar__item[data-active]:before{
              background-size: 13px;
            }
            @media all and (max-width: 767px) {
              .cart-progress-bar__bar{
                height:16px;
              }
              .cart-progress-bar__item{
                font-size:10px;
              }
              .cart-progress-bar__item:before{
                width:16px;
                height:16px;
                background-size: 10px;
              }
              .cart-progress-bar__item[data-active]:before{
                background-size: 11px;
              }
            }
          </style>
        `
        document.body.append(parseHTML(style))
        resolve()
      }
    })
  }


  async render(){
    this.globalcart = this.globalcart || await new GlobalCart()
    let tiers = await this.getTiers()


    if(!tiers.length){
      this.tiers = false
      this.setAttribute('hidden',true)
      this.next({ eventType:'ui:hidden' })
      return
    }

    this.removeAttribute('hidden')
    this.next({ eventType:'ui:show' })

    const cartTotalExcDiscount = await this.globalcart.get_CartTotalMinusFreeGifts() / 100
    const cartTotalIncDiscount = await this.globalcart.get_CartTotalMinusFreeGifts(true) / 100
    const cartDiscounts = 100 - ((cartTotalIncDiscount/cartTotalExcDiscount) * 100)

    tiers.forEach( tier => {
      tier.thresholdWithMultiplier = tier.thresholdWithMultiplier ? parseFloat(tier.thresholdWithMultiplier) : 0
      tier.threshold = parseInt(tier.threshold)  
      tier.amount = parseInt(tier.amount) || 0
    })
    tiers = tiers.sort(
      (a,b) => {
        const a_threshold =  a.threshold
        const b_threshold =  b.threshold
        return a_threshold - b_threshold
      }
    )
    .map( (tier,index) => {
      if(tiers.slice(-1)[0].calcDiscountTotal) {
         tier.active = cartTotalIncDiscount >= tier.threshold 
      } else {
         tier.active = cartTotalExcDiscount >= tier.threshold 
      }
      return tier
     })
    .map( (tier,index) => {
      const nextTier = tiers[index + 1] || false
      const nextThreshold = nextTier?.thresholdWithMultiplier || nextTier?.threshold || 0
      const previousTier = tiers[index-1]
      const previousThreshold = previousTier?.thresholdWithMultiplier || previousTier?.threshold || 0
      const threshold = tier.thresholdWithMultiplier || tier.threshold || 1
      const cartTotal = tier.thresholdWithMultiplier ? cartTotalExcDiscount : cartTotalIncDiscount

      tier.isLast = index == tiers.length - 1
      tier.isFirst = index == 0
      tier.index = index

      tier.amountUntilActive =
      (cartDiscounts && cartDiscounts == tier.amount) ||
      !tier.amount ||
      tiers.slice(-1)[0].calcDiscountTotal
        ? tier.threshold - cartTotalIncDiscount
        : tier.threshold - cartTotalExcDiscount;


      let relativeWidth =  
        !tier.active && (previousTier && !previousTier.active) ?
        0 :
        tier.active && ( threshold >= 1 || nextTier?.active ) ? 
        100 : 
        tier.active && threshold == 1 &&  !nextTier?.active  ?
        ( (nextThreshold - (nextThreshold - cartTotal)) / nextThreshold ) * 100 :
        ( (cartTotal - previousThreshold)/(threshold - previousThreshold) ) * 100   
      tier.relativeWidth =  relativeWidth < 0 ? 0 : relativeWidth > 100 ? 100 : relativeWidth

      return tier
    })

    const progressItemWidth = 100 / tiers.length
    this.progressItemWidth = `${progressItemWidth}%`

    const currentTier = [...tiers].reverse().find(({active}) => active) || false
    const nextTier = !currentTier ? tiers[0] : currentTier.isLast ? currentTier : tiers[currentTier.index + 1]

    let saving = (cartTotalExcDiscount/100) * nextTier.amount
    saving = saving.toFixed(2)
    const currencySymbol = this.globalcart.currency_symbol

    let remaining = (
      nextTier.isLast && nextTier.isFirst && nextTier.active ||
      currentTier.isLast 
    ) ? 0 : nextTier.amountUntilActive
    remaining = remaining.toFixed(2)

    let message =
      (nextTier.isLast && nextTier.isFirst && nextTier.active) ||
      currentTier.isLast
        ? nextTier.progressBarMessages_active
        : nextTier.progressBarMessages_pending;

    message = message.replace(
      '{{ remaining }}',
      `<span class="cart-progress-bar__bold">${currencySymbol}${remaining}</span>`
    )

    message = message.replace(
      '{{ saving }}',
      `<span class="cart-progress-bar__bold">${currencySymbol}${saving}</span>`
    )

    this.tiers = tiers
    this.innerHTML = `
      <p class="tac">${message}</p>
      <div class="flex row-wrap align-top justify-center">
        <div class="cart-progress-bar__bar"></div>
        ${this.tiers.map(
          tier => 
          `
            <div class="cart-progress-bar__item t-ucase block-rel lh-r" 
                 ${tier.active ? 'data-active' : ''}
                 data-threshold="${tier.threshold}">
                 ${tier.name}
            </div>
          `
        ).join('')}
      </div>
    `
    const progressBarWidth = tiers.map( 
      ({relativeWidth}) => (progressItemWidth/100) * relativeWidth
    ).reduce((a, b) => a + b, 0)

    setTimeout( () => {
      this.progressBarWidth = `${progressBarWidth}%`
    },200)
  }
}

customElements.define('global-cart-progress-bar', GlobalCartProgressBar);
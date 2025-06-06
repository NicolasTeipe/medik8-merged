// deps [DomReadyPromise] loaded globally
export class GlobalHeaderMain extends HTMLElement {
  constructor() { 
    super(); 
    this.headerHeightTimeout
  }

  connectedCallback(){
    DomReadyPromise().then( async () => {
      ["resize", "scroll", "announcement-bar-mutated", "header-dropdown-added"].forEach(eventName => {
        window.addEventListener(eventName, (e) => {
            clearTimeout(this.headerHeightTimeout);
            this.headerHeightTimeout = setTimeout(() => {
              this.updateHeaderTotalHeight();
              // For debugging
              // console.log('Height calculation event: ', e.type);
            }, 100);
        }, { passive: true })
      });
    }).catch(err =>{
      console.log(err)
    })
  }

  updateHeaderTotalHeight() {
    let headerTotalHeight = 0
    let headerNoCountdown = 0
    let headerNoAnnouncement = 0
    let headerNoTopAnnouncement = 0

    const announcementBarTop = document.getElementById("shopify-section-announcement-bar") // original announcement bar
    const mainHeader = document.querySelector("global-header-main")
    const announcementBarBottom = document.getElementById("shopify-section-header-below")
    const countdownTimerBarTop = document.getElementById("shopify-section-countdown-timer") // new LPA countdown timer

    // Trigger a reflow to ensure the layout is updated
    document.body.offsetHeight // Force reflow

    // Handle top announcement bar
    if (announcementBarTop != null) {
        const topRect = announcementBarTop.getBoundingClientRect()

        if (topRect.bottom > 0) {
            // Announcement bar is visible, so add its visible height
            headerTotalHeight += Math.max(0, topRect.height - Math.abs(topRect.top))
            headerNoCountdown += Math.max(0, topRect.height - Math.abs(topRect.top))
            headerNoAnnouncement += Math.max(0, topRect.height - Math.abs(topRect.top))
        }
    }

    // Handle main header (dropdown container)
    if (mainHeader != null) {
        headerTotalHeight += mainHeader.getBoundingClientRect().height
        headerNoCountdown += mainHeader.getBoundingClientRect().height
        headerNoAnnouncement += mainHeader.getBoundingClientRect().height
        headerNoTopAnnouncement += mainHeader.getBoundingClientRect().height
    }

    // Handle the countdown timer banner height
    if (countdownTimerBarTop != null) {
      const countdownRect = countdownTimerBarTop.getBoundingClientRect();
  
      if (countdownRect.bottom > 0) {
          headerTotalHeight += Math.max(0, countdownRect.height - Math.abs(countdownRect.top));
          headerNoAnnouncement += Math.max(0, countdownRect.height - Math.abs(countdownRect.top));
          headerNoTopAnnouncement += Math.max(0, countdownRect.height - Math.abs(countdownRect.top));
      }
    }

    // Handle bottom announcement bar only if the viewport width is 1024px or greater
    if (announcementBarBottom != null) {
        headerTotalHeight += announcementBarBottom.getBoundingClientRect().height
        headerNoCountdown += announcementBarBottom.getBoundingClientRect().height
        headerNoTopAnnouncement += announcementBarBottom.getBoundingClientRect().height
    }

    // Update CSS variable for header height
    document.body.style.setProperty('--mh-total-height-no-top-Announcement', `${Math.round(headerNoTopAnnouncement)}px`)
    document.body.style.setProperty('--mh-total-height-no-countdown', `${Math.round(headerNoCountdown)}px`)
    document.body.style.setProperty('--mh-total-height', `${Math.round(headerTotalHeight)}px`)
    document.body.style.setProperty('--mh-height', `${Math.round(headerNoAnnouncement)}px`)
  }
}

customElements.define('global-header-main', GlobalHeaderMain);

export class GlobalHeaderDropdown extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback(){
    DomReadyPromise().then( () => {
      this.template = this.querySelector('template')
      this.parentElement.addEventListener('mouseenter', () => {
        this.unwrapTemplate()
      })

      this.resizeTimeout
      this.scrollTimeout

      setTimeout(() =>{
        window.dispatchEvent(new CustomEvent('header-dropdown-added'));
      },0)
    }).catch(err =>{
      console.log(err)
    })
  }

  unwrapTemplate(){
    if(this.unwrapped){
      return
    }

    this.unwrapped = true
    this.innerHTML = this.template.innerHTML
  }
}

customElements.define('global-header-dropdown', GlobalHeaderDropdown);

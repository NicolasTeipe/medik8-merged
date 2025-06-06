import { debounce } from "../../debounce";
import { DomReadyPromise } from "../../DomReadyPromise";

export class GlobalMidPageHero extends HTMLElement {
  constructor() {
    super();
  }

  updateWidth() {
    this.buttonWidths = [...this.buttons].map(button => button.offsetWidth)
    this.maxWidth = Math.max(...this.buttonWidths)

    if(this.maxWidth >= (document.documentElement.clientWidth / this.blocks.length)) {
      this.blockSwitcher.classList.add('block-switcher--column')
    } else {
      this.blockSwitcher.classList.toggle('block-switcher--column', false)
    }
  }

  connectedCallback() {
    DomReadyPromise().then(() => {
      this.template = this.querySelector(':scope > template')

      if(!this.template) return

      this.blocks = this.template.innerHTML.split('|||')
      this.template.remove()
      

      this.buttons = this.querySelectorAll('.block-switcher-button')
      this.blockSwitcherContainer = this.querySelector('.block-switcher-container')
      this.blockSwitcher = this.querySelector('.block-switcher')
      this.blockContainer = this.querySelector('.mph-container-block')

      this.updateWidth(this.blocks)

      window.addEventListener('resize', debounce(e => {
          this.updateWidth()
        }, 100)
      )

      window.addEventListener('resize', () => {
        clearTimeout(this.resizeTimeout)
        this.resizeTimeout = setTimeout(() => {
          this.updateWidth(this.blocks)
        }, 100)
      })

      this.buttons.forEach((button, index) => {        
        this.blockSwitcherContainer.style.opacity = 1;

        button.addEventListener('click', (event) => {
          this.buttons.forEach((button) => button.classList.remove('active'))
          event.target.classList.add('active')

          this.blockContainer.innerHTML = this.blocks[index]
        })

      })
    })
  }
}

if (!customElements.get('global-mid-page-hero')) {
  customElements.define('global-mid-page-hero', GlobalMidPageHero)
}
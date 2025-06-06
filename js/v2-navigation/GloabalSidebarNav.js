// deps [ObserverLite,DomReadyPromise,parseHTML] loaded globally

function handleize(input) {
  return input
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class GloabalSidebarNav extends HTMLElement {

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
    DomReadyPromise().then( async () => {
      let settingsTemplete = this.querySelector(':scope > template')
      if(settingsTemplete){
        try{
          this.settings = JSON.parse(settingsTemplete.innerHTML)
          settingsTemplete.remove()
        }
        catch(err){
          this.remove()
          return
        }
        settingsTemplete = null
      }

      this.menuTrigger = document.getElementById('navMenuTrigger')
      
      const HeaderMainSectionDataProducer$ = new ObserverLite({key:'HeaderMainSectionDataProducer$'})
      this.headerMainSectionData = await HeaderMainSectionDataProducer$.once()
      this.init()
    }).catch(err => {
      console.error(err)
    })
  }

  init(){
    const gorgiasIcon = document.getElementById('gorgias-chat-container');
    this.#handleGorgiasIcon(gorgiasIcon); // run for initial click
    this.menuTrigger.addEventListener('click', () =>
      this.#handleGorgiasIcon(gorgiasIcon)
    );

    const {main_list,secondary_list,section_settings} = this.settings

    const {blocks} = this.headerMainSectionData
    this.screens = [{
      settings:{
        title:'main'
      }
    }]

    const lists = [main_list,secondary_list].filter( items => items?.length)

    this.footerItems = (hideText = false) => `
      <div class="bdr-t bdr-grey-3 flex ${!hideText ? ' column-nowrap':''} sidebar-nav__quick-links">
        ${
          section_settings.rewards__show &&
          section_settings.rewards__text.length &&
          section_settings.rewards__url ? (
            `
              <a href="${section_settings.rewards__url}" class="sidebar-nav__footer-item sidebar-nav__footer-item--rewards no-hover">
                ${!hideText ? section_settings.rewards__text : ''}
              </a>`
          ) : ''
        }
        ${
          section_settings.wishlist__url &&
          section_settings.wishlist__show &&
          section_settings.wishlist__text.length ? (
            `
              <a href="${section_settings.wishlist__url}" class="sidebar-nav__footer-item sidebar-nav__footer-item--wishlist no-hover">
                ${!hideText ? section_settings.wishlist__text : ''}
              </a>`
          ) : ''
        }
        ${
          section_settings.account__show &&
          section_settings.account__text.length ? (
            `
              <a href="/account" class="sidebar-nav__footer-item sidebar-nav__footer-item--account no-hover">
                ${!hideText ? section_settings.account__text: ''}
              </a>`
          ) : ''
        }
        ${
          section_settings.hc__show &&
          section_settings.hc__text.length &&
          section_settings.hc__url ? (
            `
              <a href="${section_settings.hc__url}" class="sidebar-nav__footer-item sidebar-nav__footer-item--help no-hover">
                ${!hideText ? section_settings.hc__text : ''}
              </a>`
          ) : ''
        }
        <global-country-selector class="country-selector country-selector--sidebar flex${hideText ? ' country-selector--short':''}"></global-country-selector>
      </div>
    `

    this.innerHTML = `
      <div class="sidebar-nav__screen column-nowrap gap sidebar-nav__ct--modal-close bg-grey-2" screen="main">
        <div class="flex column-nowrap scroll-flex__scroll">
          ${
            lists.map( (links,index) => {
              return `
                <div class="sidebar-nav__menu block-top${ index != 0 ? ' bdr-t bdr-grey-3' : '' }">
                  ${
                    links.map( link => {
                      const screen = blocks.find(({settings}) => settings.title == link.title)
                      if(screen){
                        this.screens.push(screen)
                      }
                      return screen ? (
                        `<button class="btn-reset sidebar-nav__menu-item d-block" screen_toggle="${screen.settings.title}"><span class="d-block text-left has-dropdown-chevron">${link.title}</span></button>`
                      ) : (
                        `<a class="sidebar-nav__menu-item" href="${link.url}">${link.title}</a>`
                      )
                    }).join('')
                  }
                </div>
              `
            }).join('')
          }
          ${this.settings.blocks?.filter(({image,link}) => image && link )?.length ? (
              `
                <div class="bdr-t bdr-grey-3 flex column-nowrap gap--d3 sidebar-nav__carousel">
                  ${
                    section_settings.cta_slider_heading?.length ? (
                    `<h3 class="sidebar-nav__menu-title">${section_settings.cta_slider_heading}</h3>`
                    ) : ''
                  }
                  <global-carousel class="d-block">
                    <template>
                      {
                        "options":{ 
                          "loop": false,
                          "skipSnaps": true
                        }
                      }
                    </template>
                    <div class="global-carousel__items block-rel cell-r">
                      <div class="global-carousel__container flex-item-grid flex-item-grid--gap-d2 flex-item-grid--2 flex-item-grid--peek-50">
                        ${
                          this.settings.blocks?.filter(({image,link}) => image && link )
                          .map( (item,index) => {
                            const {title, badgeText} = this.#cleanTitle(item.text)

                            return `
                              <a href="${item.link}" class="global-carousel__slide global-carousel__slide--auto flex-item-grid__child flex column-nowrap gap--d3 block-rel">
                                <img 
                                src="${item.image}" 
                                loading="lazy"
                                alt="${item.tile || `cta_${index}`}" 
                                class="block-ar-1 block-12/12"
                                width="256" 
                                height="256">

                                  ${title ? 
                                    `<span class="f-w600 t-xxs lh-s">${title}</text>` : ''
                                  }
                                  ${badgeText
                                    ? this.#buildBadge(badgeText, 'product-card')
                                    : ''
                                  }
                              </a>
                            `}
                          ).join('')
                        }
                      </div>
                    </div>
                  </global-carousel>
                </div>
              `
            ): ''
          }
          ${this.footerItems()}
        </div>
      </div>
    `
    const main_screen = this.getScreen('main')
    main_screen.ui = this.querySelector('[screen="main"]')
    this.bindScreenToggles(main_screen.ui)
    this.active_screen = main_screen
  }

  bindScreenToggles(screen){
    screen.querySelectorAll('[screen_toggle]').forEach( toggle => 
      toggle.addEventListener('click',(e) => {
        const target = toggle.attributes.screen_toggle.value
        this.showScreen(target)
      })
    )
  }

  getScreen(title){
    return this.screens.find(({settings}) => settings.title == title)
  }

  showScreen(target){
    const target_screen = this.getScreen(target)
    if(!target_screen.ui){
      this.renderScreen(target_screen)
    }

    this.animateOut(this.active_screen.ui)
    this.animateIn(target_screen.ui)
    this.active_screen = target_screen
  }

  animateIn(screen){
    screen.style.display = 'flex'
    screen.style.zIndex = '2'

    screen.animate([{
        opacity: 0
      }, {
        opacity: 1
      }], 150)
    .onfinish = (e) => {
      screen.style.opacity = 1
    }
  }

  animateOut(screen){
    screen.style.zIndex = '1'
    screen.animate([{
        opacity: 1
      }, {
        opacity: 0
      }], 150)
    .onfinish = (e) => {
      screen.style.opacity = 1
      screen.style.display = 'none'
    }
  }

  setDropdownHeights() {
    const allDropdowns = this.querySelectorAll('.nav-dropdown')
    allDropdowns.forEach(item => {
      const dropdown = item.querySelector('.nav-dropdown__links-wrap');
      setTimeout(() => {
        if(Number(dropdown?.scrollHeight) !== 0) {
          item.style.setProperty('--dropdown-scroll-height', `${dropdown.scrollHeight}px`);
        }
      }, 0);
    });
  }

  renderScreen(screen){
    const {settings,links,type} = screen
    const is_cta_only =  type == '6_cta'
    const hasNestedLinks =  links?.some( (link) => link.links.length) || false
    let render_links_data = []
    if(!hasNestedLinks && !is_cta_only){
      render_links_data.push({
        title:settings.list_heading?.length ?  settings.list_heading : false,
        links:links
      })
    }else if(!is_cta_only){
      render_links_data = links.map( item => {
        return {
          title: item.title,
          links:item.links
        }
      })
    }

    const cta_array = type == 'no_cta' ? false : Object.keys(settings).filter(
      key => key.includes('cta_')
    )
    .reduce((acc, key) => {
      const match = key.match(/cta_(\d+)__/)
      if (match) {
        const ctaNumber = match[1]
        const field = key.split('__')[1]
        if (!acc[ctaNumber - 1]) acc[ctaNumber - 1] = {}
        const value = settings[key]
        if (value) acc[ctaNumber - 1][field] = value
      }
      return acc
    }, [])
    .filter( 
      (item) => item.image && item.link
    )

    const cta_count = cta_array.length
    let use_carousel = false
    let items_per_row = 2
    let item_image_class = 'block-ar-1 block-12/12 block-objc'
    let cta_items = false
  
    if(cta_count){
      if(type == '2_cta_rect'){
        item_image_class = 'block-ar-2 block-12/12 block-objc'
        use_carousel = cta_count > 1
        items_per_row = use_carousel ? 1.5 : 1
      }

      if(type == '3_cta'){
        use_carousel = cta_count > 2
        items_per_row = use_carousel ? 2.5 : 2
      }

      if(type == '4_cta'){
        use_carousel = cta_count > 2
        items_per_row = use_carousel ? 2.5 : 2
      }

      cta_items = cta_array.map( (item,index) => {
        const {title, badgeText} = this.#cleanTitle(item.title)

        return `
          <img 
            src="${item.image}" 
            loading="lazy"
            alt="${item.tile || `cta_${index}`}" 
            class="${item_image_class}"
            width="256" 
            height="${type == '2_cta_rect' ? 256/1 : 256/2}">
          ${title ? 
            `<span class="f-w600 t-xs lh-s">${title}</span>` : ''
          }
          ${item.text ? 
            `<span class="f-w500 t-xs lh-xxs">${item.text}</span>` : ''
          }
          ${badgeText
            ? this.#buildBadge(badgeText, 'product-card')
            : ''
          }
        `
      })
    }

    let cta_ui = !cta_items ? false : (
      `
          ${
            settings.cta_section__title?.length ? (
              `<h3 class="sidebar-nav__menu-title">${ settings.cta_section__title}</h3>`
            ) : ''
          }
          ${
            use_carousel ? (
              `
                <global-carousel class="d-block">
                  <template>
                    {
                      "options":{ 
                        "loop": false,
                        "skipSnaps": true
                      }
                    }
                  </template>
                  <div class="global-carousel__items block-rel cell-r">
                    <div 
                      class="
                        global-carousel__container flex-item-grid flex-item-grid--gap-d2 
                        flex-item-grid--${Math.floor(items_per_row)} 
                        ${!Number.isInteger(items_per_row) ? 'flex-item-grid--peek-50' : '' }
                      "
                    >
                      ${
                        cta_array.map( (item,index) => 
                          `<a href="${item.link}" class="global-carousel__slide global-carousel__slide--auto flex-item-grid__child flex column-nowrap gap--d2 block-rel">${cta_items[index]}</a>`
                        ).join('')
                      }
                    </div>
                  </div>
                </global-carousel>
              `
            ) : (
              `
                <div class="sidebar-nav__menu-grid cell-r">
                  ${cta_array.map((item,index) => 
                      `
                        <a 
                          href="${item.link}" 
                          style="flex: 0 1 50%;"
                          class="flex column-nowrap gap--d2 product-single__thumbnails-item--small block-rel"
                        >
                          ${cta_items[index]}
                        </a>
                      `
                    ).join('')
                  }
                </div>
              `
            )
          }
      `
    )

    const ui = `
      <div 
        class="sidebar-nav__screen bg-grey-2"
        screen="${screen.settings.title}">
        <div class="bdr-b bdr-grey-3">
          <button class="sidebar-nav__screen_header-btn btn-reset t-rm f-w600" screen_toggle="main">${screen.settings.title}</button>
        </div>
        <div 
          class="flex column-nowrap scroll-flex__scroll${is_cta_only ? ' cell-l ct cb' : ''}"
        >
          ${is_cta_only ? (
          ` 
            ${cta_ui}
          `
          ) : (
          `
            ${render_links_data.map((item,index) => {
              const {title, badgeText} = this.#cleanTitle(item.title)

              return `
                  <div class="${ index < render_links_data.length - 1 ? ' bdr-b bdr-grey-3' : '' }">
                    <div class="nav-dropdown">
                      ${title ? (
                        `
                          <input type="checkbox" id="dropdown-toggle-${ index }-${handleize(title)}" class="nav-dropdown__input visually-hidden"${settings.are_navs_collapsed ? '' : ' checked'} hidden>
                          <label for="dropdown-toggle-${ index }-${handleize(title)}" class="nav-dropdown__label cell-l cell-r">
                            <h3 class="nav-dropdown__title-text has-dropdown-chevron f-w500 t-ucase ls-10 lh-1">
                              ${title}
                              ${badgeText
                                ? this.#buildBadge(badgeText, 'nav-link')
                                : ''
                              }
                            </h3>
                          </label>
                        `
                      ) : '' }
                      <div class="nav-dropdown__links-container">
                        <ul class="nav-dropdown__links-wrap">
                          ${
                            item.links.map( link => {
                              const {title, badgeText} = this.#cleanTitle(link.title)

                              return `
                                <li>
                                  <a class="nav-dropdown__link-item d-block" href="${link.url}">
                                    <span class="f-w500 t-rm lh-20 cell-l cell-r">
                                      ${badgeText
                                        ? this.#buildBadge(badgeText, 'nav-link')
                                        : ''
                                      }
                                      ${title}
                                    </span>
                                  </a>
                                </li>
                              `}
                            ).join('')
                          }
                        </ul>
                      </div>
                    </div>
                  </div>
                `}
              ).join('')
            }
          `
          )}

          ${cta_ui && !is_cta_only ? (
              `
                <div class="cell-l ct cb bdr-t bdr-grey-3 flex grow-1 column-nowrap gap--d2">
                  ${cta_ui}
                </div>
              `
            ) : ''
          }
        </div>

        ${settings.view_all__text?.length && settings.view_all__link ? (
            `
              <div class="bdr-t bdr-grey-3">
                <a href="${settings.view_all__link}" class="t-s f-w600 ct cb best-seller-link flex align-center cell-r">
                  <span class="sidebar-nav__footer-item cell-l">
                    ${settings.view_all__text}
                  </span>
                </a>
              </div>
            `
          ) : ''
        }
        ${settings.footer__items ? (
            this.footerItems('sidebar-nav__quick-links--short')
          ): ''
        }
      </div>
    `
    this.insertAdjacentHTML('beforeend',ui)
    screen.ui = this.querySelector(`[screen="${screen.settings.title}"]`)
    this.bindScreenToggles(screen.ui)
    this.setDropdownHeights()
  }

  /**
   * @param {string} str - The input string containing a title and optional badge text in brackets.
   * @returns {{title: string, badgeText: string|null}} An object with the cleaned title and extracted badge text.
   * Extracts and removes badge text from a string, returning the cleaned title and badge content.
   */
  #cleanTitle(str) {
    const title = str.replace(/\[[^\]]*\]/, '')
    const badgeText = (str.match(/\[([^\]]*)\]/) || [])[1] || null;
    return {title, badgeText}
  }

  /**
   * @param {string} badgeText - The text to display inside the badge.
   * @param {string} style - The style modifier for the badge class.
   * @returns {string} The HTML string for the styled badge.
   * Generates an HTML badge element with the given text and style.
   */
  #buildBadge(badgeText, style){
    return `<span class="badge-v2 badge-v2__${style}">${badgeText}</span>`
  }

  /**
  * Toggles zIndex between '0' and '1000' for given Gorgias icon.
  * @param {HTMLElement} gorgiasIcon - The Gorgias icon element to modify
  * @returns {void}
  */
  #handleGorgiasIcon(gorgiasIcon) {
    gorgiasIcon && (gorgiasIcon.style.zIndex = gorgiasIcon.style.zIndex == '0' ? '1000' : '0');
  }
}

customElements.define('global-sidebar-nav', GloabalSidebarNav);

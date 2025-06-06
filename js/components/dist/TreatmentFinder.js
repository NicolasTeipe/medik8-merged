export class TreatmentFinder extends HTMLElement {
  constructor() {
    super();
    this.typeFilters = [];
  }

  // Extract URL building logic into a helper method
  buildCollectionUrl(baseUrl) {
    if (baseUrl === '#' || !this.typeFilters.length) return baseUrl;
    const queryString = this.typeFilters.map((item) => `filter_type=${item.type}`).join('&');
    return `${baseUrl}?${queryString}`;
  }

  // Extract filter text formatting into a helper method
  formatFilterText(filters) {
    if (filters.length <= 2) {
      return filters.map((item) => item.filter).join(', ');
    }
    const firstTwo = filters
      .slice(0, 2)
      .map((item) => item.filter)
      .join(', ');
    return `${firstTwo} +${filters.length - 2} more`;
  }

  // Update button state helper
  updateButtonState(btn, href, isDisabled) {
    btn.setAttribute('href', href);
    btn.innerText = btn.getAttribute(isDisabled ? 'data-disabled-text' : 'data-active-text');
    btn.classList.toggle('treatment-finder__btn--disabled', isDisabled);
  }

  // Add resetForm as a class method
  resetForm() {
    // Reset type filters
    this.typeFilters = [];
    this.querySelectorAll('.gbl-styled-checkbox__input').forEach((input) => {
      input.checked = false;
    });

    // Reset concern selection
    this.querySelectorAll('.gbl-image-thumb-checkbox__input').forEach((input) => {
      input.checked = false;
    });
  }

  connectedCallback() {
    this.filterButtons = this.querySelectorAll('.dropdown-button');
    this.filterSections = this.querySelectorAll('.treatment-finder__content-item');

    const initializeState = () => {
      this.typeFilters = [];
      const concernButton = this.filterButtons[0];
      const typeButton = this.filterButtons[1];
      const btn = this.querySelector('.treatment-finder__btn');

      // Handle concern checkbox state
      const checkedConcern = this.querySelector('.gbl-image-thumb-checkbox__input:checked');

      if (checkedConcern) {
        const selectedConcern = checkedConcern.value;
        const selectedCollection = checkedConcern.getAttribute('data-collection');

        // Update concern button text
        if (concernButton) {
          concernButton.querySelector('span').innerText = selectedConcern;
        }

        // Update button state and make it active
        this.updateButtonState(btn, selectedCollection, false);

        // Handle type filters separately
        this.querySelectorAll('.gbl-styled-checkbox__input:checked').forEach((input) => {
          const selectedType = input.value;
          const selectedFilter = input.getAttribute('data-label');
          this.typeFilters.push({
            type: selectedType,
            filter: selectedFilter,
          });
        });

        // Update type filter button text and URL
        if (this.typeFilters.length > 0 && typeButton) {
          typeButton.querySelector('span').innerText = this.formatFilterText(this.typeFilters);
          // Update URL without changing button state
          const newUrl = this.buildCollectionUrl(selectedCollection);
          btn.setAttribute('href', newUrl);
        } else if (typeButton) {
          typeButton.querySelector('span').innerText = typeButton.getAttribute('data-placeholder');
        }
      } else {
        // Reset concern button text to placeholder and disable button
        if (concernButton) {
          concernButton.querySelector('span').innerText = concernButton.getAttribute('data-placeholder');
        }
        this.updateButtonState(btn, '#', true);

        // Reset type button text
        if (typeButton) {
          typeButton.querySelector('span').innerText = typeButton.getAttribute('data-placeholder');
        }
      }
    };

    if (this.hasAttribute('data-reset-form')) {
      const actionButton = this.querySelector('.treatment-finder__btn');
      actionButton.addEventListener('click', (e) => {
        if (actionButton.getAttribute('href') !== '#') {
          // reset the form once the page is in transition to the next page
          window.addEventListener(
            'pagehide',
            () => {
              this.resetForm();
            },
            { once: true }
          );
        }
      });
    } else {
      // Initialize state after a short delay
      setTimeout(() => {
        initializeState();
      }, 100);

      // Re-initialize state when browser history changes
      window.addEventListener('popstate', () => {
        this.typeFilters = []; // Reset filters first
        initializeState(); // Immediately initialize without setTimeout
      });
    }

    // Handle dropdown button clicks
    this.filterButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        let closeAll = false;

        if (!this.classList.contains('treatment-finder--open-by-default')) {
          if (button.classList.contains('active')) {
            closeAll = true;
            this.filterSections[index].parentNode.classList.add('hidden');
          }
        }

        this.filterSections.forEach((section) => {
          section.classList.add('hidden');
        });

        this.filterButtons.forEach((button) => {
          button.classList.remove('active');
        });

        // Toggle visibility of filter sections
        if (!closeAll) {
          this.filterSections[index].parentNode.classList.remove('hidden');
          button.classList.add('active');
          this.filterSections[index].classList.remove('hidden');
        }
      });
    });

    // Handle concern checkbox clicks
    this.querySelectorAll('.gbl-image-thumb-checkbox__input').forEach((input) => {
      input.addEventListener('click', () => {
        // Ensure only one concern can be selected at a time
        this.querySelectorAll('.gbl-image-thumb-checkbox__input').forEach((otherInput) => {
          if (otherInput !== input) {
            otherInput.checked = false;
          }
        });

        const selectedConcern = input.value;
        const selectedCollection = input.getAttribute('data-collection');
        const btn = this.querySelector('.treatment-finder__btn');

        if (!input.checked) {
          this.updateButtonState(btn, '#', true);

          this.filterButtons.forEach((button) => {
            if (button.classList.contains('active')) {
              button.querySelector('span').innerText = button.getAttribute('data-placeholder');
            }
          });
        } else {
          let newHref = selectedCollection;
          if (this.typeFilters.length > 0) {
            const queryString = this.typeFilters.map((item) => `filter_type=${item.type}`).join('&');
            newHref = `${selectedCollection}?${queryString}`;
          }
          this.updateButtonState(btn, newHref, false);

          this.filterButtons.forEach((button) => {
            if (button.classList.contains('active')) {
              button.querySelector('span').innerText = selectedConcern;
            }
          });
        }
      });
    });

    // Update type filter checkbox click handler
    this.querySelectorAll('.gbl-styled-checkbox__input').forEach((input) => {
      input.addEventListener('click', () => {
        const selectedType = input.value;
        const selectedFilter = input.getAttribute('data-label');
        const typeButton = this.filterButtons[1];
        const btn = this.querySelector('.treatment-finder__btn');

        if (input.checked) {
          this.typeFilters.push({
            type: selectedType,
            filter: selectedFilter,
          });
        } else {
          this.typeFilters = this.typeFilters.filter((item) => item.type !== selectedType);
        }

        if (this.typeFilters.length > 0) {
          typeButton.querySelector('span').innerText = this.formatFilterText(this.typeFilters);

          const currentHref = btn.getAttribute('href');
          if (currentHref && currentHref !== '#') {
            const baseUrl = currentHref.split('?')[0];
            const newUrl = this.buildCollectionUrl(baseUrl);
            btn.setAttribute('href', newUrl);
          }
        } else {
          typeButton.querySelector('span').innerText = typeButton.getAttribute('data-placeholder');
          const currentHref = btn.getAttribute('href');
          if (currentHref && currentHref !== '#') {
            btn.setAttribute('href', currentHref.split('?')[0]);
          }
        }
      });
    });
  }
}

if (!customElements.get('treatment-finder')) {
  customElements.define('treatment-finder', TreatmentFinder);
}

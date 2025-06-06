/**
 * A custom element that manages a takeover toggle switch for dynamic page transitions.
 * Handles takeover content transition, triggering animations, and managing visibility.
 */
export class GlobalTakeoverToggle extends HTMLElement {
  constructor() {
    super();
  }

  /**
   * Lifecycle method called when the element is added to the DOM.
   * Sets up the toggle input, fetch delay, and event listeners.
   */
  connectedCallback() {
    /** @type {HTMLInputElement} The input toggle element. */
    this.toggle = this.querySelector('input');

    /** @type {number} The delay (in milliseconds) for the fetch animation. */
    this.fetchDelay = parseInt(this.dataset.fetchDelay, 10);

    this.addToggleListener();
  }

  /**
   * Adds an event listener to the toggle switch for handling state changes.
   */
  addToggleListener() {
    this.toggle.addEventListener('change', e => {
      e.preventDefault();

      // Disable the toggle to prevent repeated inputs.
      this.toggle.disabled = true;

      // Reset content positions to be ready for takeover transition.
      document
        .querySelectorAll('#takeover-content, #PageContainer .default-content')
        .forEach(el => el.classList.remove('move-content'));

      // Dispatch the event to start the animation process.
      this.dispatchTakeoverFetch(!this.toggle.checked);

      // Trigger the content transition after the animation delay.
      setTimeout(() => {
        this.toggleTakeoverContent(this.toggle.checked);
      }, this.fetchDelay);
    });
  }

  /**
   * Handles the transition of content and page elements during a takeover.
   * @param {boolean} toggleChecked - Indicates whether the toggle is in the checked state.
   */
  toggleTakeoverContent(toggleChecked) {
    // Toggle dark mode based on the toggle input state.
    document.body.classList.toggle('dark-mode', toggleChecked);

    // Toggle visibility of default and takeover content.
    document.querySelector('#PageContainer .default-content').style.display =
      toggleChecked ? 'none' : 'block';
    document.querySelector('#takeover-content').style.display = toggleChecked
      ? 'block'
      : 'none';

    // Dispatch an event to signal that the takeover transition is completing.
    document.dispatchEvent(new CustomEvent('takeoverComplete'));

    // Re-enable the toggle switch.
    this.toggle.disabled = false;
  }

  /**
   * Dispatches an event to trigger the animation process via takeover loader.
   * @param {boolean} isReversing - Indicates whether the takeover is reversing.
   */
  dispatchTakeoverFetch(isReversing) {
    document.dispatchEvent(
      new CustomEvent('takeoverFetching', {
        detail: {
          isReversing,
        },
      })
    );
  }
}

customElements.define('global-takeover-toggle', GlobalTakeoverToggle);

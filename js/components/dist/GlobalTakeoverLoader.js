/**
 * A custom element that manages the visual takeover loader, including animations,
 * SVG handling, and event-driven transitions.
 */
export class TakeoverLoader extends HTMLElement {
  /**
   * Initializes the loader with default state values.
   */
  constructor() {
    super();

    /** @type {number | null} Timeout for resetting the takeover. */
    this.resetTimeoutContainer = null;

    /** @type {number | null} Timeout for fetch failsafe. */
    this.fetchTimeoutFailsafe = null;

    /** @type {boolean} Indicates if the loader is animating out. */
    this.isAnimatingOut = false;

    /** @type {number} Duration for the fetch failsafe (in milliseconds). */
    this.fetchFailsafeDuration = 8888;

    /** @type {boolean} Indicates if the loader is reversing the takeover. */
    this.isReversing = false;
  }

  /**
   * Lifecycle method called when the element is added to the DOM.
   * Sets up initial state, parses template data, and initializes listeners.
   */
  connectedCallback() {
    /** @type {number} Delay for resetting the takeover (in milliseconds). */
    this.resetDelay = parseInt(getComputedStyle(this).getPropertyValue("--takeover-reset-delay"), 10) || 1500;

    let template = this.querySelector(":scope > template");

    if (!template) {
      this.handleError("Template not found", true);
      return;
    }

    /** @type {{ logo?: string, background?: string }} Parsed image data from the template. */
    this.imageData = JSON.parse(template.innerHTML);
    
    // If we don't have either don't run to code further than this.
    if (this.imageData.logo === undefined && this.imageData.background === undefined) return;

    /** @type {boolean} Indicates if the takeover is active. */
    this.isTakingOver = false;

    /** @type {boolean} Indicates if the takeover rollout is complete. */
    this.takeoverRollout = false;

    template.remove();
    this.setupSVGs();

    DomReadyPromise()
      .then(() => {
        this.setupListeners();
      })
      .catch((err) => console.error(err));
  }

  /**
   * Resets the takeover state and clears active animations.
   */
  resetTakeover() {
    this.classList.remove("active", "hiding");
    this.takeoverRollout = false;
    this.isTakingOver = false;

    if (this.resetTimeoutContainer !== null) {
      clearTimeout(this.resetTimeoutContainer);
      this.resetTimeoutContainer = null;
    }
  }

  /**
   * Activates the takeover animation.
   */
  startTakeover() {
    this.classList.add("active");
    this.isTakingOver = true;
    this.isAnimatingOut = true;
  }

  /**
   * Marks the end of the takeover animation and resets after a delay.
   */
  finishTakeover() {
    this.classList.add("hiding");
    this.takeoverRollout = true;
    this.isAnimatingOut = true;

    this.resetTimeoutContainer = setTimeout(() => {
      this.isAnimatingOut = false;
      this.resetTakeover();
    }, this.resetDelay);
  }

  /**
   * Sets up event listeners for takeover-related events and debugging controls.
   */
  setupListeners() {
    const isReversingCheck = (isReversing) => {
      if (isReversing) {
        this.classList.add("reversing");
      } else {
        this.classList.remove("reversing");
      }
    };

    const clearFetchTimeoutFailsafe = () => {
      if (this.fetchTimeoutFailsafe) {
        clearTimeout(this.fetchTimeoutFailsafe);
      }
    };
    
    // If transition doesn't complete, end the animation to prevent a stuck page.
    const failSafe = () => {
      clearFetchTimeoutFailsafe();
      this.fetchTimeoutFailsafe = setTimeout(() => {
        console.warn("Timeout reached: Triggering takeoverComplete automatically.");
        this.finishTakeover();
      }, this.fetchFailsafeDuration);
    };
    
    //  Start a takeover animation event.
    document.addEventListener("takeoverFetching", (e) => {
      this.isReversing = e?.detail?.isReversing || false;
      isReversingCheck(this.isReversing);
      this.startTakeover();
      failSafe();
    });
    
    // Takeover animation completes.
    document.addEventListener("takeoverComplete", () => {
      clearFetchTimeoutFailsafe();
      this.finishTakeover();
    });
    
    // Built-in animation triggers for testing. Enabled if toggled.
    if (this.hasAttribute("data-testing")) {
      document.addEventListener("keydown", (e) => {
        if (e.key === "1") {
          document.dispatchEvent(
            new CustomEvent("takeoverFetching", {
              detail: {
                isReversing: this.isReversing,
              },
            }),
          );
          console.info(`Key: ${e.key} | Event: takeoverFetching`);
        }
        if (e.key === "2" && this.classList.contains("active")) {
          document.dispatchEvent(new CustomEvent("takeoverComplete"));
          console.info(`Key: ${e.key} | Event: takeoverComplete`);
        }
        if (e.key === "3") {
          this.isReversing = !this.isReversing;
          isReversingCheck(this.isReversing);
          console.info(`Key: ${e.key} | Event: reversing takeover ${this.isReversing.toString().toUpperCase()}`);
        }
      });
    }
  }

  /**
   * Loads and appends SVGs for the logo and background from provided URLs.
   */
  async setupSVGs() {
    const logoUrl = this.imageData.logo;
    const backgroundUrl = this.imageData.background;

    if (backgroundUrl !== undefined) {
      try {
        const backgroundSvg = await this.fetchSVG(backgroundUrl);
        const backgroundElement = document.createElement("div");
        backgroundElement.classList.add("takeover-background-wrapper");
        backgroundElement.innerHTML = backgroundSvg;
        this.appendChild(backgroundElement);
      } catch (err) {
        console.error("Error loading backgroundUrl: ", err);
      }
    }

    if (logoUrl !== undefined) {
      try {
        const logoSvg = await this.fetchSVG(logoUrl);
        const logoElement = document.createElement("div");
        logoElement.classList.add("takeover-logo-wrapper");
        logoElement.innerHTML = logoSvg;
        this.appendChild(logoElement);
      } catch (err) {
        console.error("Error loading logoUrl: ", err);
      }
    }
  }

  /**
   * Fetches an SVG file from the specified URL.
   * @param {string} url - The URL of the SVG file to fetch.
   * @returns {Promise<string>} The SVG content as a string.
   */
  async fetchSVG(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch SVG from ${url}`);
    }
    return await response.text();
  }

  /**
   * Logs and optionally throws errors related to the loader.
   * @param {string} message - The error message.
   * @param {boolean} [isFatal=false] - Whether to throw the error.
   */
  handleError(message, isFatal = false) {
    console.error(message);
    if (isFatal) {
      throw new Error(message);
    }
  }
}

customElements.define("global-takeover-loader", TakeoverLoader);

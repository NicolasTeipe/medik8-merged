/**
 * NewsletterForm Web Component
 *
 * This component provides a newsletter signup form with email validation, 
 * error handling.
 *
 * @element newsletter-form
 */

export class NewsletterForm extends HTMLElement {
  /**
   * Constructor for the NewsletterForm class.
   * Initializes properties for form elements and state.
   */
  constructor() {
    super();
    this.submitButton = null; // Submit button element
    this.emailInput = null;  // Email input element
    this.isSubmitDisabled = true; // Flag to track submit button state
    this.isEmailValid = false;   // Flag to track email validity
    this.form = null;         // Form element
  }

  /**
   * Called when the component is connected to the DOM.
   * Sets up event listeners and initializes other functionality.
   */
  connectedCallback() {
    DomReadyPromise()
      .then(() => {
        this.submitButton = this.querySelector('button[type="submit"]');
        this.emailInput = this.querySelector('input[type="email"]');
        this.form = this.querySelector("form");

        if (this.emailInput && this.submitButton && this.form && !Array.from(this.form.classList).some(className => className.includes('klaviyo'))) {
          this.setupEventListeners();
        }

        this.setupSuccessMessageBox();
        this.setupPolicyFancyBoxLinks();
        this.handleScrollToView();
      })
      .catch((err) => {
        console.error(err);
      });
  }

  /**
   * Validates an email address using a regular expression.
   * @param {string} email - The email address to validate.
   * @returns {boolean} True if the email is valid, false otherwise.
   */
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Creates an error message element.
   * @param {string} message - The error message to display.
   * @returns {HTMLParagraphElement} The error message element.
   */
  createErrorMessage(message) {
    const errorParagraph = document.createElement("p");
    errorParagraph.classList.add("input-error-message", "red");
    errorParagraph.innerHTML = `
          <span class="visually-hidden">Error</span>
          <span>
            <i class="fa fa-exclamation-circle" style="font-family: 'Font Awesome 5 Free' !important;" aria-hidden="true"></i>
            ${message}
          </span>
        `;
    return errorParagraph;
  }

  /**
   * Removes the error message element from the DOM.
   */
  removeErrorMessage() {
    const existingError = this.querySelector(".input-error-message");

    if (existingError) {
      existingError.remove();
    }
  }

  /**
   * Checks if there is an error in the email input field.
   * Updates the state of the email validity flag and adds/removes error styles.
   */
  isThereInputError() {
    this.isEmailValid = this.validateEmail(this.emailInput.value);
    this.emailInput.parentNode.classList.toggle("input-group--error", !this.isEmailValid);
  }

  /**
   * Handles the blur event on the email input field.
   * Checks for errors and updates the submit button state.
   */
  handleInputBlur() {
    this.isThereInputError();
    this.isSubmitDisabled = !this.isEmailValid;

    if (this.isEmailValid) {
      this.removeErrorMessage();
    }
  }

  /**
   * Handles the form submission.
   * Prevents default submission, validates the email, and submits the form if valid.
   * @param {Event} e - The submit event object.
   */
  handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    this.isThereInputError();
    this.removeErrorMessage();

    if (this.emailInput.value === "") {
      this.emailInput.parentNode.insertAdjacentElement("afterend", this.createErrorMessage("Email can't be blank."));
      return;
    }

    if (!this.isEmailValid) {
      this.emailInput.parentNode.insertAdjacentElement("afterend", this.createErrorMessage("Please enter a valid email address."));
      return;
    }

    if (this.isSubmitDisabled === false) {
      this.form.submit();
      this.submitButton.classList.add("loading");
    }
  }

  /**
   * Sets up event listeners for form elements.
   */
  setupEventListeners() {
    this.emailInput.addEventListener("keyup", (e) => {
      e.preventDefault();
      if (e.key === "Enter") {
        this.handleSubmit(e);
      } else {
        this.handleInputBlur();
      }
    });

    this.emailInput.addEventListener("focus", () => {
      if (this.emailInput.value === "") {
        this.isSubmitDisabled = true;
      }
    });

    this.emailInput.addEventListener("blur", () => this.handleInputBlur());
    this.submitButton.addEventListener("click", (e) => this.handleSubmit(e));
  }

  /**
   * Sets up the success message box and its close button functionality.
   */
  setupSuccessMessageBox() {
    const successMessageBox = this.querySelector(`[data-form-status]`);
    const successMessageBoxCloseBtn = this.querySelector(`[data-form-status] .close-toast`);

    if (successMessageBox && successMessageBoxCloseBtn) {
      successMessageBoxCloseBtn.addEventListener("click", () => {
        const hiddenInputs = this.querySelectorAll(`.input-group.visually-hidden`);
        hiddenInputs.forEach((hiddenInput) => {
          hiddenInput.classList.remove("visually-hidden");
        });

        successMessageBox.classList.add("visually-hidden");
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }

  /**
   * Sets up event listeners for policy fancybox links.
   * Fetches policy content from a JSON file and displays it in a modal.
   */
  setupPolicyFancyBoxLinks() {
    const policyFancyBoxLink = this.querySelector(".js-policy-fancybox");
    if(policyFancyBoxLink) {
      policyFancyBoxLink.addEventListener("click", async (e) => {
        e.preventDefault();
        const url = `${policyFancyBoxLink.href}.json`;
        window.loadedPolicyModals = window.loadedPolicyModals || {};
        let modal = window.loadedPolicyModals[url] || false;

        if (!modal) {
          let content = await fetch(url);
          content = content.status == 200 ? await content.json() : false;
          content = content?.policy?.body || false;
          if (!content) {
            return;
          }

          modal = window.loadedPolicyModals[url] = new ModalBox({
            content: `
                  <div style="width:100%;max-width:700px;background:#fff;padding:var(--gutter-unit);padding-right:0;">
                    <div style="max-height:75vh;overflow-x:hidden;overflow-y:auto;padding-right:var(--gutter-unit);color: var(--color-black);">${content}</div>
                  </div>
                `,
            settings: {
              containerCloseButton: true,
            },
          });
        }

        modal.open();
      });
    }
  }

  /**
   * Handles scrolling the form into view if the URL hash matches the form's ID.
   */
  handleScrollToView() {
    const shouldScroll = this.form && window.location.hash.includes(`#${this.form.id}`);
    if (shouldScroll) {
      window.addEventListener("load", () => {
        this.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }
}

if (!customElements.get("newsletter-form")) {
  customElements.define("newsletter-form", NewsletterForm);
}

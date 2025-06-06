if (!customElements.get('f-oos-notify')) {
  customElements.define('f-oos-notify', class FOosNotify extends HTMLElement {
    constructor() {
      super();

      this.ObserverLite = new ObserverLite()
      this.button = this.querySelector('button');
      this.emailInput = this.querySelector('[name="email"]');
      this.acceptPolicyInput = this.querySelector('[name="oos-accept-policy"]');
      this.message = this.querySelector('.js-oos-notification-form__message');
      this.publicApiKey = this.getAttribute('data-klaviyo-api')
      this.klaviyoUrl = `https://a.klaviyo.com/client/back-in-stock-subscriptions/?company_id=${this.publicApiKey}`;

      this.setupEmailHandler();
      this.setupAcceptPolicyHandler();
      this.setupButtonHandler();
      this.enableIfValid();
    }

    setupButtonHandler() {
      if (this.button != null) {
        this.button.addEventListener('click', this.submitKlaviyoEvent.bind(this), { passive: true });
      }
    }

    setupEmailHandler() {
      if (this.emailInput != null) {
        this.emailInput.addEventListener('input', this.enableIfValid.bind(this), { passive: true });
      }
    }

    setupAcceptPolicyHandler() {
      if (this.acceptPolicyInput != null) {
        this.acceptPolicyInput.addEventListener('change', this.enableIfValid.bind(this), { passive: true });
      }
    }

    submitKlaviyoEvent() {
      if (this.emailInput.checkValidity()) {
        this.updateMessage();
        this.setDisabled();

        const options = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            revision: '2024-02-15',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            data: {
              type: 'back-in-stock-subscription',
              attributes: {
                channels: ['EMAIL'],
                profile: {
                  data: {
                    type: 'profile',
                    attributes: {
                      email: this.emailInput.value,
                    }
                  }
                }
              },
              relationships: {
                variant: {
                  data: {
                    type: 'catalog-variant',
                    id: `$shopify:::$default:::${document.getElementById('productSelect').value}`
                  }
                }
              }
            }
          })
        };

        fetch(this.klaviyoUrl, options)
          .then(() => {
            this.ObserverLite.next()
            this.updateMessage(this.messageStates.success)
          })
          .catch(() => this.updateMessage(this.messageStates.error))
          .finally(() => this.setEnabled());
        }
    }

    enableIfValid() {
      if (this.emailInput.checkValidity() && this.acceptPolicyInput.checked) {
        this.setEnabled();
      } else {
        this.setDisabled();
      }
    }

    updateMessage(newMessage = null) {
      if (newMessage == null) {
        this.message.innerHTML = ''; // Empty element
        return;
      }

      this.message.innerHTML = newMessage;
    }

    setDisabled() {
      this.button.setAttribute('disabled', 'disabled');
    }

    setEnabled() {
      this.button.removeAttribute('disabled');
    }

    cleanup() {
      this.button.removeEventListener('click', this.submitKlaviyoEvent.bind(this), { passive: true });
      this.emailInput.removeEventListener('input', this.enableIfValid.bind(this), { passive: true });
      this.acceptPolicyInput.removeEventListener('change', this.enableIfValid.bind(this), { passive: true });
    }

    get messageStates() {
      return {
        default: this.dataset.messageDefault,
        success: this.dataset.messageSuccess,
        error: this.dataset.messageError,
      };
    }

    disconnectedCallback() {
      this.cleanup();
    }
  });
}

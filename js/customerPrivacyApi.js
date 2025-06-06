export function customerPrivacyApi() {
  const customerPrivacyApi$ = new ObserverLite({key:'Shopify.customerPrivacyApi'})
  window.Shopify.loadFeatures(
    [
      {
        name: 'consent-tracking-api',
        version: '0.1',
      },
    ],
    error => {
      if (error) {
        console.error(error);
        return;
      }

      document.addEventListener('visitorConsentCollected', e => {
        if (e.detail.analyticsAllowed) {
          initClarity();
          customerPrivacyApi$.next({
            analyticsAllowed: true
          })
        }
      });

      if (window.Shopify.customerPrivacy.analyticsProcessingAllowed()) {
        initClarity();
        customerPrivacyApi$.next({
          analyticsAllowed: true
        })
      }
    }
  );

  function initClarity() {
    typeof window.clarity === 'function' && window.clarity('consent');
  }
}

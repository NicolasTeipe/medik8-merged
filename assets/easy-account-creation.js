(() => {
  const options = {
    as_first_section: {
      selector: ".step__sections .section:has(.section__content)",
      target: "afterbegin",
    },
    under_order_summary: {
      selector: ".order-summary__sections",
      target: "beforeend",
    },
    before_map: {
      selector:
        "main.main__content .step__sections .section__content .content-box:has(.map)",
      target: "beforebegin",
    },
    after_map: {
      selector:
        "main.main__content .step__sections .section__content .content-box:has(.map)",
      target: "afterend",
    },
    before_order_details: {
      selector:
        "main.main__content .step__sections .section__content .content-box:last-child",
      target: "beforebegin",
    },
    after_order_details: {
      selector: "main.main__content .step__sections .section__content",
      target: "beforeend",
    },
  };

  const currentOption = "before_map";

  function renderContent(html, createParentEl = false, option = "default") {
    if (option === "default") {
      if (!createParentEl) {
        const el = document.querySelector(
          ".step__sections .section:has(.section__content)"
        );
        console.log("el", el);
        el.insertAdjacentHTML("beforebegin", html);
      }
      window.Shopify.Checkout.OrderStatus.addContentBox(html);
      return;
    }

    const optionObj = options[option];
    const parent = document.querySelector(optionObj?.selector);
    if (!parent) return;

    parent.insertAdjacentHTML(
      optionObj.target,
      createParentEl
        ? `<div class="content-box"><div class="content-box__row">${html}</div></div>`
        : html
    );
  }

  async function activateAccount() {
    if (!window.Shopify && !Shopify.checkout && Shopify.Checkout.OrderStatus)
      return;
    if (!window.Shopify.checkout.email) return;

    let loader;

    try {
      const loaderRes = await fetch("/a/lc-caa-proxy/get-loader");
      loader = await loaderRes.json();

      if (loader) renderContent(loader.html, false, currentOption);
    } catch (error) {
      console.log("Loader is not loaded");
    }

    const hasAccount = await checkForCustomerAccount(
      window.Shopify.checkout.customer_id,
      window.Shopify.checkout.order_id,
      window.Shopify.checkout.email
    );

    if (hasAccount) {
      if (loader?.html && loader?.selector) {
        const loaderEl = document.querySelector(loader.selector);
        loaderEl.style.display = "none";
      }
      return;
    }

    try {
      const response = await fetch(
        `/a/lc-caa-proxy/get-form?order_id=${window.Shopify.checkout.order_id}`
      );
      const data = await response.json();

      if (!data || !data.html) return;

      if (loader?.html && loader?.selector) {
        const loaderEl = document.querySelector(loader.selector);
        loaderEl.style.display = "none";
      }

      renderContent(data.html, true, currentOption);
    } catch (error) {
      console.error("Activate Account [get-form]:", error);
    }
  }

  async function checkForCustomerAccount(id, order_id, email) {
    try {
      const emailParam = encodeURIComponent(email);
      const response = await fetch(
        `/a/lc-caa-proxy/check-customer?id=${id}&order_id=${order_id}&email=${emailParam}`
      );
      return await response.json();
    } catch (error) {
      console.log("Error while checking customer", error);
      return true;
    }
  }

  setTimeout(activateAccount, 2000);
})();

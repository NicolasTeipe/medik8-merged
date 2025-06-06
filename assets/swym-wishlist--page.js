

var noProductCardMarkup =
    `<div class="swym-wishlist-grid">
		<p style="margin-bottom: 45px; text-align: center;">You dont have any favorites, see <a href="/collections/all" style="text-decoration: underline;">all products</a>!</p>
	</div>`;

var productCardMarkup =
  `<div class="swym-wishlist-grid">

		<div class="swym-wishlist-actions">
      <button id="swym-custom-emailWishlist" class="js-show-swym-wishlist-share btn--full btn--outline">
        <i class="wayfx-icon wayfx-icon-email"></i><span>Share wishlist</span>
      </button>
			<button id="swym-custom-add-all-toCartBtn" class="btn--full btn--outline btn--sold-out" disabled>
        All Added To Bag
			</button>
		</div>

		<div class="wayfx-products">
      {{#products}}
        <div id="wayfx-product-{{epi}}" class="wayfx-product__item wayfx-product__item--grid grid__item">
          <a href="{{du}}" aria-label="{{dt}}" class="wayfx-product__grid-image">
            <img alt="{{dt}}" src="{{iu}}" data-productid="{{empi}}" data-variantid="{{epi}}" onerror="javascript: getUpdatedImage(this)">
              <button id="swym-remove-productBtn" type="button" class="fancybox-button fancybox-close-small" title="Remove" data-variant-id="{{epi}}" data-product-id="{{empi}}">
                <svg xmlns="http://www.w3.org/2000/svg" version="1" viewBox="0 0 24 24"><path d="M13 12l5-5-1-1-5 5-5-5-1 1 5 5-5 5 1 1 5-5 5 5 1-1z"></path></svg>
            </button>
          </a>
          <p class="wayfx-product__grid-title">
            <a href="{{du}}">{{dt}}</a>
          </p>
          <p class="wayfx-product__grid-subtitle">
            {{vi}}
          </p>
          <p class="wayfx-product__grid-price">
            <span>{{cu}}{{pr}}</span>
          </p>
          <div class="wayfx-product__grid-add">
            <button
              class="swym-custom-add-toCartBtn btn--full btn--outline {{#isInCart}}btn--added{{/isInCart}}"
              data-state-cart="{{#isInCart}} swym-added{{/isInCart}}"
              data-product-url="{{du}}"
              data-variant-id="{{epi}}"
              data-product-id="{{empi}}">
                {{#isInCart}}
                  Added to Bag
                {{/isInCart}}
                {{^isInCart}}
                  Add to Bag
                {{/isInCart}}
            </button>
          </div>
        </div>
      {{/products}}
		</div>
	</div>`;



window.SwymCallbacks = window.SwymCallbacks || []

// Keep track of out of stock products
var swymOutOfStockProducts = []

window.SwymCallbacks.push(swymRenderWishlist); /* Init Here */

window.GlobalCartMain.subscribe( () => {
  setTimeout(function(){
    window.SwymCallbacks.push(swymRenderWishlist); /* On cart change render wishlist again. */
  }, 500);
});

function swymAddMultipleToCartAndRedirect(episOrVariantIds, successCallback, errorCallback) {
  var formData = new FormData();
  episOrVariantIds.forEach(function(epiOrVariantId) {
    if(!swymOutOfStockProducts.includes(epiOrVariantId)){
    	formData.append("id[]", epiOrVariantId);
    }
  });
  var request = new XMLHttpRequest();
  request.addEventListener("load", function() {
    if(this.status == 200) {
      if(successCallback) {
        successCallback(this);
      }
    } else {
      if(errorCallback) {
        errorCallback(this);
      }
    }
  });
  request.open("POST", "/cart/add.js");
  request.send(formData);
}

function swymUpdateAddAllToCartButton() {
  const products = []
  document.querySelectorAll('button.swym-custom-add-toCartBtn').forEach(button => {
    if (!button.classList.contains('btn--added') && !button.classList.contains('btn--sold-out')) {
      products.push(button.getAttribute('data-variant-id'))
    }
  })

  const addAllToCartBtn = document.getElementById('swym-custom-add-all-toCartBtn')

  if (products.length === 0) {
    if (!addAllToCartBtn.disabled) {
      addAllToCartBtn.disabled = true
      addAllToCartBtn.textContent = 'All Added To Bag'
      addAllToCartBtn.classList.add('btn--sold-out')
      addAllToCartBtn.removeEventListener('click', handleAddAllToCartClick)
    }
  } else {
    if (addAllToCartBtn.disabled) {
      addAllToCartBtn.disabled = false
      addAllToCartBtn.textContent = 'Add All To Bag'
      addAllToCartBtn.classList.remove('btn--sold-out')
      addAllToCartBtn.addEventListener('click', handleAddAllToCartClick)
    }
  }

  function handleAddAllToCartClick() {
    this.innerHTML = '<img style="position: relative; top: 1px; height: 14px;" src="https://cdn.medik8.com/dd7aab93-06ca-45e0-939c-af4b7956bcb8/loader.svg" alt="" />'
    swymAddMultipleToCartAndRedirect(products, () => {
      window.GlobalCartMain.updateData()
      window.globalSideBarUI__cart.open()
      setTimeout(() => {
        window.SwymCallbacks.push(swymRenderWishlist) // On cart change, render wishlist again
      }, 500)
    }, e => {
      console.error(e)
    })
  }
}


function swymRenderWishlist(swat) {
  swat.fetch(function(products) {

    const wishlistContentsContainer = document.getElementById("wishlist-items-container")
    if(!products.length) {
      wishlistContentsContainer.innerHTML = SwymUtils.renderTemplateString(noProductCardMarkup, {})
      return
    }
	
    const formattedWishlistedProducts = products.map((product) => {
      product = SwymUtils.formatProductPrice(product); // formats product price and adds currency to product Object
      product.isInCart = _swat.platform.isInDeviceCart(product.epi) || (product.et == _swat.EventTypes.addToCart);
      return product
    })

    wishlistContentsContainer.innerHTML = SwymUtils.renderTemplateString(productCardMarkup, {
      products: formattedWishlistedProducts
    });

    products.forEach((product) => {
      const url = `${product.du.split('?')[0]}.json`
      fetch(url)
      .then( response => response.json())
      .then( data => {
        const shopifyProduct = data?.product || false
        if(!shopifyProduct) return
 
        if (shopifyProduct.product_type == 'Bundles') {
          const bundleVariantId = shopifyProduct.variants[0].id

          // Do not add bundle products to cart via add all button as it will only add
          // the bundle product object, not the bundle items.
          swymOutOfStockProducts.push(bundleVariantId);

          // Add bundle attr to bundle items for use when adding to cart
          document.querySelector(
            `.swym-custom-add-toCartBtn[data-variant-id="${bundleVariantId}"]`
          ).setAttribute('isbundle', '');
        }
        const variant = shopifyProduct.variants.find(e => e.id == product.epi);
        const productTitleElement = document.querySelector(`#wayfx-product-${product.epi} .wayfx-product__grid-title a`);
     
        if (shopifyProduct.variants.length > 1 && variant) {
          productTitleElement.textContent = variant.title;
        }

        swymUpdateAddAllToCartButton();
      }).catch(err =>  console.log(err))
    })

    // add a delay to allow for isbundle attr to be set
    setTimeout(function() {
      attachClickListeners();
    }, 500)
    
  })
}

function onAddToCartClick(e) {
	e.preventDefault();
	var productId = e.currentTarget.getAttribute("data-product-id");
	var variantId = e.currentTarget.getAttribute("data-variant-id");
	var du = e.target.getAttribute("data-product-url");
	e.target.innerHTML = '<img style="position: relative; top: 1px;" src="https://cdn.medik8.com/dd7aab93-06ca-45e0-939c-af4b7956bcb8/loader.svg" alt="" />';
	window._swat.replayAddToCart({
		empi: productId,
		du: du
	}, variantId, function(c) {
		e.target.innerHTML = "Added to Bag";
		e.target.setAttribute("data-state-cart", "swym-added");
		e.target.classList.add("btn--added");
      window.GlobalCartMain.updateData()
      window.globalSideBarUI__cart.open()
      swymUpdateAddAllToCartButton();
	}, function(e) {
		// console.log(e);
	});
}

function attachClickListeners() {
  const bundleButtons = document.querySelectorAll('.swym-custom-add-toCartBtn[isbundle]');
  bundleButtons.forEach(b => {
    b.innerHTML = 'View Bundle'
    b.addEventListener('click', () => {
      window.location.assign(b.getAttribute('data-product-url'));
    })
  })

	var addToCartButtons = document.querySelectorAll('.swym-custom-add-toCartBtn:not([isbundle])');
	var removeBtns = document.querySelectorAll("#swym-remove-productBtn");
	//   Add to cart Btns
	for (var i = 0; i < addToCartButtons.length; i++) {
		addToCartButtons[i].addEventListener('click', onAddToCartClick, false);
	}
	//   Remove Buttons
	for (var k = 0; k < removeBtns.length; k++) {
		removeBtns[k].addEventListener('click', onRemoveBtnClick, false);
	}


  const shareWishListButton = document.querySelector('.js-show-swym-wishlist-share:not([data-bound])')

  shareWishListButton.addEventListener('click',(e) => {
    shareWishListButton.dataset.bound = true
    window.swymShareModal = window.swymShareModal || new ModalBox({
      content: SHARE_WISHLIST_HTML,
      settings: {
        containerCloseButton: true,
      },
    })
    window.swymShareModal.toggle()
  })
}

function onRemoveBtnClick(e) {
	e.preventDefault();
	var epi = +e.currentTarget.getAttribute("data-variant-id");
	var empi = +e.currentTarget.getAttribute("data-product-id");
	window._swat.fetch(function(products) {
		products.forEach(function(product) {
			if (epi && empi && product.epi == epi && product.empi == empi) {
				window._swat.removeFromWishList(product, function() {
					if (!window.SwymCallbacks) {
						window.SwymCallbacks = [];
					}
					window.SwymCallbacks.push(swymRenderWishlist);
				});
			}
		});
	})
}

/**
 * If an image fails to load, use the storefront api to load an
 * updated image for the given variant.
 * @param {HTMLImageElement} img 
 */
function getUpdatedImage(img) {
  // using a 1px base64 img to display nothing for now as better than showing a no-img icon whilst waiting on fetch
  img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

  if (!window.Shopify.storefrontApi) return

  fetch(`https://${window.Shopify.shop}/api/${window.Shopify.storefrontApi.version}/graphql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/graphql',
    'X-Shopify-Storefront-Access-Token': window.Shopify.storefrontApi.token
  },
  body: `
    query {
      product(id: "gid://shopify/Product/${img.dataset.productid}") {
        variants(first: 20) {
          nodes {
            id
            image {
              transformedSrc(maxWidth: 400)
            }
          }
        }
      }
    }
  `
})
    .then(response => response.json())
    .then(data => {
      const newImage = data?.data?.product?.variants?.nodes.find(n => {
        return n.id.split('/ProductVariant/')[1] == img.dataset.variantid
      }).image.transformedSrc

      if (newImage) img.src = newImage

      // TODO - Add an actual fallback product img in the event the api doesn't return a suitable img
    });
}


class ShareSwymForm extends HTMLElement {

  constructor() { 
    super();
  }


  connectedCallback(){
    DomReadyPromise().then( () => {
      if(!this.bound){
        this.bind()
      }
    }).catch(err => {
      console.log(err)
    })
  }

  bind(){
    this.bound = true

    this.querySelector("form").addEventListener('submit', event => {
      event.preventDefault()
      const form = event.target
      const submitButton = form.querySelector('[type="submit"]')
      const fromEmail = form.from_email.value
      const toEmail = form.to_email.value
      const note = form.wishlist_note.value
  
      const onSend = r => {
        if(window.swymShareModal){
          window.swymShareModal.close() 
        }
        submitButton.disabled = false
        form.to_email.value = ''
        form.wishlist_note.value = ''
      }
  
      const onSendError = r => {
        if(window.swymShareModal){
          window.swymShareModal.close() 
        }
        console.error(r)
      }
  
      window._swat.sendListViaEmail(
        {
          toEmailId: toEmail,
          fromName: fromEmail,
          note: note
          // lid and cprops are commented out as they seem to be unused or for future use
        },
        onSend, onSendError
      )
    })
    
  }

}

customElements.define('share-swym-form', ShareSwymForm);



DomReadyPromise().then( () => {
  window.SwymCallbacks = window.SwymCallbacks || []
  window.SwymCallbacks.push(swat => {
    document.querySelector('.wayfx-header__favorites').style.display = 'none' // Hide the wishlist from the header
  })
}).catch(err =>  {
  console.log(err)
})

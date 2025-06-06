/* Jonathan Snook - MIT License - https://github.com/snookca/prepareTransition */
(function(a){a.fn.prepareTransition=function(){return this.each(function(){var b=a(this);b.one("TransitionEnd webkitTransitionEnd transitionend oTransitionEnd",function(){b.removeClass("is-transitioning")});var c=["transition-duration","-moz-transition-duration","-webkit-transition-duration","-o-transition-duration"];var d=0;a.each(c,function(a,c){d=parseFloat(b.css(c))||d});if(d!=0){b.addClass("is-transitioning");b[0].offsetWidth}})}})(jQuery);

/* replaceUrlParam */
function replaceUrlParam(e,r,a){var n=new RegExp("("+r+"=).*?(&|$)"),c=e;return c=e.search(n)>=0?e.replace(n,"$1"+a+"$2"):c+(c.indexOf("?")>0?"&":"?")+r+"="+a};

/*! lazysizes - v5.2.2 */
!function(e){var t=function(u,D,f){"use strict";var k,H;if(function(){var e;var t={lazyClass:"lazyload",loadedClass:"lazyloaded",loadingClass:"lazyloading",preloadClass:"lazypreload",errorClass:"lazyerror",autosizesClass:"lazyautosizes",srcAttr:"data-src",srcsetAttr:"data-srcset",sizesAttr:"data-sizes",minSize:40,customMedia:{},init:true,expFactor:1.5,hFac:.8,loadMode:2,loadHidden:true,ricTimeout:0,throttleDelay:125};H=u.lazySizesConfig||u.lazysizesConfig||{};for(e in t){if(!(e in H)){H[e]=t[e]}}}(),!D||!D.getElementsByClassName){return{init:function(){},cfg:H,noSupport:true}}var O=D.documentElement,a=u.HTMLPictureElement,P="addEventListener",$="getAttribute",q=u[P].bind(u),I=u.setTimeout,U=u.requestAnimationFrame||I,l=u.requestIdleCallback,j=/^picture$/i,r=["load","error","lazyincluded","_lazyloaded"],i={},G=Array.prototype.forEach,J=function(e,t){if(!i[t]){i[t]=new RegExp("(\\s|^)"+t+"(\\s|$)")}return i[t].test(e[$]("class")||"")&&i[t]},K=function(e,t){if(!J(e,t)){e.setAttribute("class",(e[$]("class")||"").trim()+" "+t)}},Q=function(e,t){var i;if(i=J(e,t)){e.setAttribute("class",(e[$]("class")||"").replace(i," "))}},V=function(t,i,e){var a=e?P:"removeEventListener";if(e){V(t,i)}r.forEach(function(e){t[a](e,i)})},X=function(e,t,i,a,r){var n=D.createEvent("Event");if(!i){i={}}i.instance=k;n.initEvent(t,!a,!r);n.detail=i;e.dispatchEvent(n);return n},Y=function(e,t){var i;if(!a&&(i=u.picturefill||H.pf)){if(t&&t.src&&!e[$]("srcset")){e.setAttribute("srcset",t.src)}i({reevaluate:true,elements:[e]})}else if(t&&t.src){e.src=t.src}},Z=function(e,t){return(getComputedStyle(e,null)||{})[t]},s=function(e,t,i){i=i||e.offsetWidth;while(i<H.minSize&&t&&!e._lazysizesWidth){i=t.offsetWidth;t=t.parentNode}return i},ee=function(){var i,a;var t=[];var r=[];var n=t;var s=function(){var e=n;n=t.length?r:t;i=true;a=false;while(e.length){e.shift()()}i=false};var e=function(e,t){if(i&&!t){e.apply(this,arguments)}else{n.push(e);if(!a){a=true;(D.hidden?I:U)(s)}}};e._lsFlush=s;return e}(),te=function(i,e){return e?function(){ee(i)}:function(){var e=this;var t=arguments;ee(function(){i.apply(e,t)})}},ie=function(e){var i;var a=0;var r=H.throttleDelay;var n=H.ricTimeout;var t=function(){i=false;a=f.now();e()};var s=l&&n>49?function(){l(t,{timeout:n});if(n!==H.ricTimeout){n=H.ricTimeout}}:te(function(){I(t)},true);return function(e){var t;if(e=e===true){n=33}if(i){return}i=true;t=r-(f.now()-a);if(t<0){t=0}if(e||t<9){s()}else{I(s,t)}}},ae=function(e){var t,i;var a=99;var r=function(){t=null;e()};var n=function(){var e=f.now()-i;if(e<a){I(n,a-e)}else{(l||r)(r)}};return function(){i=f.now();if(!t){t=I(n,a)}}},e=function(){var v,m,c,h,e;var y,z,g,p,C,b,A;var n=/^img$/i;var d=/^iframe$/i;var E="onscroll"in u&&!/(gle|ing)bot/.test(navigator.userAgent);var _=0;var w=0;var N=0;var M=-1;var x=function(e){N--;if(!e||N<0||!e.target){N=0}};var W=function(e){if(A==null){A=Z(D.body,"visibility")=="hidden"}return A||!(Z(e.parentNode,"visibility")=="hidden"&&Z(e,"visibility")=="hidden")};var S=function(e,t){var i;var a=e;var r=W(e);g-=t;b+=t;p-=t;C+=t;while(r&&(a=a.offsetParent)&&a!=D.body&&a!=O){r=(Z(a,"opacity")||1)>0;if(r&&Z(a,"overflow")!="visible"){i=a.getBoundingClientRect();r=C>i.left&&p<i.right&&b>i.top-1&&g<i.bottom+1}}return r};var t=function(){var e,t,i,a,r,n,s,l,o,u,f,c;var d=k.elements;if((h=H.loadMode)&&N<8&&(e=d.length)){t=0;M++;for(;t<e;t++){if(!d[t]||d[t]._lazyRace){continue}if(!E||k.prematureUnveil&&k.prematureUnveil(d[t])){R(d[t]);continue}if(!(l=d[t][$]("data-expand"))||!(n=l*1)){n=w}if(!u){u=!H.expand||H.expand<1?O.clientHeight>500&&O.clientWidth>500?500:370:H.expand;k._defEx=u;f=u*H.expFactor;c=H.hFac;A=null;if(w<f&&N<1&&M>2&&h>2&&!D.hidden){w=f;M=0}else if(h>1&&M>1&&N<6){w=u}else{w=_}}if(o!==n){y=innerWidth+n*c;z=innerHeight+n;s=n*-1;o=n}i=d[t].getBoundingClientRect();if((b=i.bottom)>=s&&(g=i.top)<=z&&(C=i.right)>=s*c&&(p=i.left)<=y&&(b||C||p||g)&&(H.loadHidden||W(d[t]))&&(m&&N<3&&!l&&(h<3||M<4)||S(d[t],n))){R(d[t]);r=true;if(N>9){break}}else if(!r&&m&&!a&&N<4&&M<4&&h>2&&(v[0]||H.preloadAfterLoad)&&(v[0]||!l&&(b||C||p||g||d[t][$](H.sizesAttr)!="auto"))){a=v[0]||d[t]}}if(a&&!r){R(a)}}};var i=ie(t);var B=function(e){var t=e.target;if(t._lazyCache){delete t._lazyCache;return}x(e);K(t,H.loadedClass);Q(t,H.loadingClass);V(t,L);X(t,"lazyloaded")};var a=te(B);var L=function(e){a({target:e.target})};var T=function(t,i){try{t.contentWindow.location.replace(i)}catch(e){t.src=i}};var F=function(e){var t;var i=e[$](H.srcsetAttr);if(t=H.customMedia[e[$]("data-media")||e[$]("media")]){e.setAttribute("media",t)}if(i){e.setAttribute("srcset",i)}};var s=te(function(t,e,i,a,r){var n,s,l,o,u,f;if(!(u=X(t,"lazybeforeunveil",e)).defaultPrevented){if(a){if(i){K(t,H.autosizesClass)}else{t.setAttribute("sizes",a)}}s=t[$](H.srcsetAttr);n=t[$](H.srcAttr);if(r){l=t.parentNode;o=l&&j.test(l.nodeName||"")}f=e.firesLoad||"src"in t&&(s||n||o);u={target:t};K(t,H.loadingClass);if(f){clearTimeout(c);c=I(x,2500);V(t,L,true)}if(o){G.call(l.getElementsByTagName("source"),F)}if(s){t.setAttribute("srcset",s)}else if(n&&!o){if(d.test(t.nodeName)){T(t,n)}else{t.src=n}}if(r&&(s||o)){Y(t,{src:n})}}if(t._lazyRace){delete t._lazyRace}Q(t,H.lazyClass);ee(function(){var e=t.complete&&t.naturalWidth>1;if(!f||e){if(e){K(t,"ls-is-cached")}B(u);t._lazyCache=true;I(function(){if("_lazyCache"in t){delete t._lazyCache}},9)}if(t.loading=="lazy"){N--}},true)});var R=function(e){if(e._lazyRace){return}var t;var i=n.test(e.nodeName);var a=i&&(e[$](H.sizesAttr)||e[$]("sizes"));var r=a=="auto";if((r||!m)&&i&&(e[$]("src")||e.srcset)&&!e.complete&&!J(e,H.errorClass)&&J(e,H.lazyClass)){return}t=X(e,"lazyunveilread").detail;if(r){re.updateElem(e,true,e.offsetWidth)}e._lazyRace=true;N++;s(e,t,r,a,i)};var r=ae(function(){H.loadMode=3;i()});var l=function(){if(H.loadMode==3){H.loadMode=2}r()};var o=function(){if(m){return}if(f.now()-e<999){I(o,999);return}m=true;H.loadMode=3;i();q("scroll",l,true)};return{_:function(){e=f.now();k.elements=D.getElementsByClassName(H.lazyClass);v=D.getElementsByClassName(H.lazyClass+" "+H.preloadClass);q("scroll",i,true);q("resize",i,true);q("pageshow",function(e){if(e.persisted){var t=D.querySelectorAll("."+H.loadingClass);if(t.length&&t.forEach){U(function(){t.forEach(function(e){if(e.complete){R(e)}})})}}});if(u.MutationObserver){new MutationObserver(i).observe(O,{childList:true,subtree:true,attributes:true})}else{O[P]("DOMNodeInserted",i,true);O[P]("DOMAttrModified",i,true);setInterval(i,999)}q("hashchange",i,true);["focus","mouseover","click","load","transitionend","animationend"].forEach(function(e){D[P](e,i,true)});if(/d$|^c/.test(D.readyState)){o()}else{q("load",o);D[P]("DOMContentLoaded",i);I(o,2e4)}if(k.elements.length){t();ee._lsFlush()}else{i()}},checkElems:i,unveil:R,_aLSL:l}}(),re=function(){var i;var n=te(function(e,t,i,a){var r,n,s;e._lazysizesWidth=a;a+="px";e.setAttribute("sizes",a);if(j.test(t.nodeName||"")){r=t.getElementsByTagName("source");for(n=0,s=r.length;n<s;n++){r[n].setAttribute("sizes",a)}}if(!i.detail.dataAttr){Y(e,i.detail)}});var a=function(e,t,i){var a;var r=e.parentNode;if(r){i=s(e,r,i);a=X(e,"lazybeforesizes",{width:i,dataAttr:!!t});if(!a.defaultPrevented){i=a.detail.width;if(i&&i!==e._lazysizesWidth){n(e,r,a,i)}}}};var e=function(){var e;var t=i.length;if(t){e=0;for(;e<t;e++){a(i[e])}}};var t=ae(e);return{_:function(){i=D.getElementsByClassName(H.autosizesClass);q("resize",t)},checkElems:t,updateElem:a}}(),t=function(){if(!t.i&&D.getElementsByClassName){t.i=true;re._();e._()}};return I(function(){H.init&&t()}),k={cfg:H,autoSizer:re,loader:e,init:t,uP:Y,aC:K,rC:Q,hC:J,fire:X,gW:s,rAF:ee}}(e,e.document,Date);e.lazySizes=t,"object"==typeof module&&module.exports&&(module.exports=t)}("undefined"!=typeof window?window:{});

/*============================================================================
  Money Format
  - Shopify.format money is defined in option_selection.js.
    If that file is not included, it is redefined here.
==============================================================================*/

if ((typeof Shopify) === 'undefined') { Shopify = {}; }
if (!Shopify.formatMoney) {
  Shopify.formatMoney = function(cents, format) {

    var value = '',
        placeholderRegex = /\{\{\s*(\w+)\s*\}\}/,
        formatString = (format || this.money_format);

    if (typeof cents == 'string') {
      cents = cents.replace('.','');
    }

    function defaultOption(opt, def) {
      return (typeof opt == 'undefined' ? def : opt);
    }

    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ',');
      decimal   = defaultOption(decimal, '.');

      if (isNaN(number) || number == null) {
        return 0;
      }

      number = (number/100.0).toFixed(precision);

      var parts   = number.split('.'),
          dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
          cents   = parts[1] ? (decimal + parts[1]) : '';

      return dollars + cents;
    }

    let matchResult = formatString.match(placeholderRegex)
    matchResult = matchResult && matchResult[1] ? matchResult[1] : false
    if(!matchResult) {  
      const {shopMoneyFormat,cartCurrencySymbol} = window
      formatString = shopMoneyFormat ? shopMoneyFormat : cartCurrencySymbol ? `${cartCurrencySymbol}` : false
      matchResult = formatString.match(placeholderRegex)[1]
    }

    switch(matchResult) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }

    return formatString.replace(placeholderRegex, value);
  };
}

window.wayfx = window.wayfx || {};

wayfx.cacheSelectors = function () {
  wayfx.cache = {
    // General
    $html                    : $('html'),
    $body                    : $(document.body),

    // Collection Pages
    $changeView              : $('.change-view'),

    // Product Page
    $productImage            : $('#ProductPhotoImg'),
    $thumbImages             : $('#ProductThumbs').find('a.product-single__thumbnail'),

    // Customer Pages
    $recoverPasswordLink     : $('#RecoverPassword'),
    $hideRecoverPasswordLink : $('#HideRecoverPasswordLink'),
    $recoverPasswordForm     : $('#RecoverPasswordForm'),
    $customerLoginForm       : $('#CustomerLoginForm'),
    $passwordResetSuccess    : $('#ResetSuccess')
  };
};

wayfx.init = function () {
  wayfx.cacheSelectors();
  wayfx.productImageSwitch();
  wayfx.responsiveVideos();
  wayfx.collectionViews();
  wayfx.loginForms();
  wayfx.collectionProgress();
};


wayfx.getHash = function () {
  return window.location.hash;
};

wayfx.productPage = function (options) {
  var moneyFormat = options.money_format,
      variant = options.variant,
      selector = options.selector;

  // Selectors
  var $productImage = $('#ProductPhotoImg'),
      $addToCart = $('#AddToCart'),
      $productPrice = $('#ProductPrice'),
      $comparePrice = $('#ComparePrice'),
      $quantityElements = $('.quantity-selector, label + .js-qty'),
      $addToCartText = $('#AddToCartText');

  if (variant) {

    // Update variant image, if one is set
    if (variant.featured_image) {
      var newImg = variant.featured_image,
          el = $productImage[0];
      Shopify.Image.switchImage(newImg, el, wayfx.switchImage);
    }

    // Select a valid variant if available
    if (variant.available) {
      // Available, enable the submit button, change text, show quantity elements
      $addToCart.removeClass('disabled').prop('disabled', false);
      $addToCartText.html("Añadir al carrito");
      $quantityElements.show();
    } else {
      // Sold out, disable the submit button, change text, hide quantity elements
      $addToCart.addClass('disabled').prop('disabled', true);
      $addToCartText.html("Agotado");
      $quantityElements.hide();
    }

    // Regardless of stock, update the product price
    $productPrice.html( Shopify.formatMoney(variant.price, moneyFormat) );

    // Also update and show the product's compare price if necessary
    if (variant.compare_at_price > variant.price) {
      $comparePrice
        .html(" Comparar en" + ' ' + Shopify.formatMoney(variant.compare_at_price, moneyFormat))
        .show();
    } else {
      $comparePrice.hide();
    }

  } else {
    // The variant doesn't exist, disable submit button.
    // This may be an error or notice that a specific variant is not available.
    // To only show available variants, implement linked product options:
    //   - http://docs.shopify.com/manual/configuration/store-customization/advanced-navigation/linked-product-options
    $addToCart.addClass('disabled').prop('disabled', true);
    $addToCartText.html("No disponible");
    $quantityElements.hide();
  }
};

wayfx.productImageSwitch = function () {
  if (wayfx.cache.$thumbImages.length) {
    // Switch the main image with one of the thumbnails
    // Note: this does not change the variant selected, just the image
    wayfx.cache.$thumbImages.on('click', function(evt) {
      evt.preventDefault();
      var newImage = $(this).attr('href');
      wayfx.switchImage(newImage, null, wayfx.cache.$productImage);
    });
  }
};

wayfx.switchImage = function (src, imgObject, el) {
  // Make sure element is a jquery object
  var $el = $(el);
  $el.attr('src', src);
};

wayfx.responsiveVideos = function () {
  var $iframeVideo = $('iframe[src*="youtube.com/embed"]:not(.no_wrapper), iframe[src*="player.vimeo"]:not(.no_wrapper)');
  var $iframeReset = $iframeVideo.add('iframe#admin_bar_iframe');

  $iframeVideo.each(function () {
    // Add wrapper to make video responsive
    $(this).wrap('<div class="video-wrapper"></div>');
  });

  $iframeReset.each(function () {
    this.src = this.src;
  });
};

wayfx.collectionViews = function () {
  if (wayfx.cache.$changeView.length) {
    wayfx.cache.$changeView.on('click', function() {
      var view = $(this).data('view'),
          url = document.URL,
          hasParams = url.indexOf('?') > -1;

      if (hasParams) {
        window.location = replaceUrlParam(url, 'view', view);
      } else {
        window.location = url + '?view=' + view;
      }
    });
  }
};

wayfx.loginForms = function() {
  function showRecoverPasswordForm() {
    wayfx.cache.$recoverPasswordForm.show();
    wayfx.cache.$customerLoginForm.hide();
  }

  function hideRecoverPasswordForm() {
    wayfx.cache.$recoverPasswordForm.hide();
    wayfx.cache.$customerLoginForm.show();
  }

  wayfx.cache.$recoverPasswordLink.on('click', function(evt) {
    evt.preventDefault();
    showRecoverPasswordForm();
  });

  wayfx.cache.$hideRecoverPasswordLink.on('click', function(evt) {
    evt.preventDefault();
    hideRecoverPasswordForm();
  });

  // Allow deep linking to recover password form
  if (wayfx.getHash() === '#recover') {
    showRecoverPasswordForm();
  }
};


wayfx.collectionProgress = function() {
	var collectionProgress = $('.js-collection-aov');
  if(collectionProgress.length){



    $(window).on('load resize scroll', function () {
      let header = document.querySelector('.wayfx-header')
      header = header.getBoundingClientRect()
      let stickyTop = header.height + header.top - 3

      let messageBar = document.querySelector('.js-below-header-msg-bar')
      messageBar = messageBar?.getBoundingClientRect()
      stickyTop = messageBar ? stickyTop + messageBar.height : stickyTop
      collectionProgress.css('top',stickyTop)

        
      if (collectionProgress.offset().top - $(this).scrollTop() > stickyTop) {
        collectionProgress.removeClass('sticky');
      } else {
        collectionProgress.addClass('sticky');
      }
       
    })
  }
};

wayfx.resetPasswordSuccess = function() {
  wayfx.cache.$passwordResetSuccess.show();
};

/*============================================================================
  Drawer modules
==============================================================================*/
wayfx.Drawers = (function () {
  var Drawer = function (id, position, options) {
    var defaults = {
      close: '.js-drawer-close',
      open: '.js-drawer-open-' + position,
      openClass: 'js-drawer-open',
      dirOpenClass: 'js-drawer-open-' + position
    };

    this.$nodes = {
      parent: $('body'),
      page: $('#PageContainer'),
      moved: $('.is-moved-by-drawer')
    };

    this.config = $.extend(defaults, options);
    this.position = position;

    this.$drawer = $('#' + id);

    if (!this.$drawer.length) {
      return false;
    }

    this.drawerIsOpen = false;
    this.init();
  };

  Drawer.prototype.init = function () {
    $(this.config.open).on('click', $.proxy(this.open, this));
    this.$drawer.find(this.config.close).on('click', $.proxy(this.close, this));
  };

  Drawer.prototype.open = function (evt) {
    // Keep track if drawer was opened from a click, or called by another function
    var externalCall = false;

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the drawer opens, the click event bubbles up to $nodes.page
    // which closes the drawer.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.drawerIsOpen && !externalCall) {
      return this.close();
    }

    // Notify the drawer is going to open
    wayfx.cache.$body.trigger('beforeDrawerOpen.wayfx', this);

    // Add is-transitioning class to moved elements on open so drawer can have
    // transition for close animation
    this.$nodes.moved.addClass('is-transitioning');
    this.$drawer.prepareTransition();

    this.$nodes.parent.addClass(this.config.openClass + ' ' + this.config.dirOpenClass);
    this.drawerIsOpen = true;

    // Set focus on drawer
    this.trapFocus(this.$drawer, 'drawer_focus');

    // Run function when draw opens if set
    if (this.config.onDrawerOpen && typeof(this.config.onDrawerOpen) == 'function') {
      if (!externalCall) {
        this.config.onDrawerOpen();
      }
    }

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    // Lock scrolling on mobile
    this.$nodes.page.on('touchmove.drawer', function () {
      return false;
    });

    this.$nodes.page.on('click.drawer', $.proxy(function () {
      this.close();
      return false;
    }, this));

    // Notify the drawer has opened
    wayfx.cache.$body.trigger('afterDrawerOpen.wayfx', this);
  };

  Drawer.prototype.close = function () {
    if (!this.drawerIsOpen) { // don't close a closed drawer
      return;
    }

    // Notify the drawer is going to close
    wayfx.cache.$body.trigger('beforeDrawerClose.wayfx', this);

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    // Ensure closing transition is applied to moved elements, like the nav
    this.$nodes.moved.prepareTransition({ disableExisting: true });
    this.$drawer.prepareTransition({ disableExisting: true });

    this.$nodes.parent.removeClass(this.config.dirOpenClass + ' ' + this.config.openClass);

    this.drawerIsOpen = false;

    // Remove focus on drawer
    this.removeTrapFocus(this.$drawer, 'drawer_focus');

    this.$nodes.page.off('.drawer');

    wayfx.cache.$body.trigger('afterDrawerClose.wayfx', this);
  };

  Drawer.prototype.trapFocus = function ($container, eventNamespace) {
    var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

    $container.attr('tabindex', '-1');

    $container.focus();

    $(document).on(eventName, function (evt) {
      if ($container[0] !== evt.target && !$container.has(evt.target).length) {
        $container.focus();
      }
    });
  };

  Drawer.prototype.removeTrapFocus = function ($container, eventNamespace) {
    var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

    $container.removeAttr('tabindex');
    $(document).off(eventName);
  };

  return Drawer;
})();

/*============================================================================
  AJAX Add to Cart
==============================================================================*/

$(document).ready(function() {
  handleWindowResize();
  window.addEventListener('resize', function() {
    handleWindowResize();
  });
});

function handleWindowResize() {
  isMobile = window.outerWidth <= 768;
}


function changeButton(step, product) {
  $('.wayfx-builder__step[data-step="' + step + '"] .wayfx-builder__step-body button')
  	.removeClass("btn--remove").addClass("btn--add")
  	.find('.wayfx-text')
  	.html('Add to Bag');

  $('#builder-' + step + '-'+ product)
    .removeClass("btn--add").addClass("btn--remove")
    .find('.wayfx-text')
    .html('Remove');
}

var builder_cart_count = $('.wayfx-builder-header__current-count'),
    builder_header_steps = $('.wayfx-builder-header__step'),
    builder_cart_button = $("#wayfx-builder-cart"),
    builder_cart_badge_class = 'wayfx-builder-header__cart--badge',
    builder_body_class = $('.wayfx-builder__step-body'),
    builder_product_class = $('.wayfx-builder__step-product');

var isMobile = false;

function incompleteSteps(c) {
  var builder_empty_steps = $(".wayfx-builder__step[data-selected-title='']"),
  	  builder_empty_step = $(".wayfx-builder__step[data-selected-title='']").data('step');

  if (builder_empty_steps.length > 0) {
    builder_empty_steps.each(function() {
      $(this).addClass('incomplete');
      $(this).find('.wayfx-builder__step-product').html('You still need to select a product').show();
    });
    scrollToStep(builder_empty_step);
  } else {
    if(c) {
      window.GlobalCartMain.updateData()
      window.globalSideBarUI__cart.open()
    }
  }
}

function scrollToStep(step) {
  var scrollPosition;
  if (isMobile) {
    scrollPosition = $("#step-" + step).offset().top - 67;
  } else {
    scrollPosition = $("#step-"+ step).offset().top - 100;
  }
  $('html, body').animate({
    scrollTop: scrollPosition
  }, 200);
}

function openStep(step) {
  var builder_steps = $('.wayfx-builder__step'),
      builder_header_step = $('.wayfx-builder-header__step[data-step="'+ step +'"]'),
      builder_step = $('.wayfx-builder__step[data-step="'+ step +'"]'),
      builder_body_class = $('.wayfx-builder__step-body');

  builder_header_steps.removeClass('current');

  if(!(builder_header_step).hasClass('completed')) {
    //builder_header_step.addClass('current');
  }

  if(!(builder_step).hasClass('open')) {

    builder_steps
    .removeClass("open").addClass("closed")
    .find(builder_body_class)
    .slideUp(200);

    builder_step
    .removeClass("closed").addClass("open")
    .find(builder_body_class)
    .slideDown(200);

    setTimeout(function(){
    	scrollToStep(step);
    }, 300);

  } else {

    setTimeout(function(){
    	scrollToStep(step);
    }, 300);

  }
}

builder_cart_button.on( "click", function() {
  incompleteSteps(true);
});

function changeStep(current, next, title, builder_total) {
  var current_header_step = $('.wayfx-builder-header__step[data-step="' + current + '"]'),
      current_body_step = $('.wayfx-builder__step[data-step="' + current + '"]'),
      next_header_step = $('.wayfx-builder-header__step[data-step="' + next + '"]'),
      next_body_step = $('.wayfx-builder__step[data-step="' + next + '"]'),
      builder_count = parseInt(builder_total);

  builder_cart_button.addClass(builder_cart_badge_class);

  current_header_step.removeClass('incomplete current').addClass('completed');
  next_header_step.addClass('current');
  current_body_step.find(builder_product_class).html(title).show();
  current_body_step.removeClass('open incomplete').addClass('closed completed').attr('data-selected-title', title).find(builder_body_class).hide();

  if (builder_count < 3) {
    next_body_step.removeClass('closed').addClass('open');
    next_body_step.find(builder_body_class).slideDown(200);
    $('.wayfx-builder__success').hide();

    if(!next) {
   		scrollToStep(next);
  	}
  }
}

function addItem(step, product, title, category, cart_count) {
   $.ajax({
      url: "/cart.js",
      dataType: 'json',
      success: function (cart) {
        let items = cart.items;
        var builder_count = 1,
            builder_step = $(".wayfx-builder__step[data-step='" + step + "']");

        $.each(items, function(index, item) {
          if(item.properties._csa_builder) {
              builder_count++;
          }
        });

        $.ajax({
            type: 'POST',
            url: '/cart/add.js',
            dataType: 'json',
            data: {
              id: product,
              quantity: 1,
              properties: {
                '_csa_builder': category
              }
            },
            success: function (res) {
              var builder_header_step = $('.wayfx-builder-header__step[data-step="'+ step +'"]'),
                  builder_body_step = $('.wayfx-builder__step[data-step="'+ step +'"]');

              changeButton(step, product);

              if(step === 1) {
                changeStep(step, 2, title, builder_count);
              }

              if(step === 2) {
                changeStep(step, 3, title, builder_count);
              }

              if(step === 3) {
                changeStep(step, false, title, builder_count);
              }

              builder_cart_count.html(builder_count);

              if(builder_count === 3) {
                window.GlobalCartMain.updateData()
                window.globalSideBarUI__cart.open()

                $(document).mouseup(function (e) {
                  if($('body').hasClass('js-drawer-open')) {
                    if ($(e.target).closest('#CartDrawer').length === 0) {
                      setTimeout(function(){
                        $("html, body").animate({ scrollTop: $(document).height() }, "slow");
                        setTimeout(function(){
                          $('.wayfx-builder__success').fadeIn();
                        }, 300);
                      }, 300);
                    }
                  }
                });

                $('.drawer__close').on( "click", function() {
                  setTimeout(function(){
                      $("html, body").animate({ scrollTop: $(document).height() }, "slow");
                     setTimeout(function(){
                      $('.wayfx-builder__success').fadeIn();
                     }, 300);
                  }, 300);
                });

              } else {
               	$('.wayfx-builder__success').hide();
              }
          },
          error: function () {}
      });
   }
 });
}

$('.btn--add').on( "click", function() {
  var step = $(this).data('step'),
      title = $(this).data('product-title'),
      category = $(this).data('type'),
      product = $(this).data('product-id');
  addToBuilder(this, step, product, title, category);
});

$('.btn--remove').on( "click", function() {
  var step = $(this).data('step'),
      title = $(this).data('product-title'),
      category = $(this).data('type'),
      product = $(this).data('product-id');
  addToBuilder(this, step, product, title, category);
});

function addToBuilder(e, step, product, title, category) {
  if($(e).hasClass('btn--remove')) {
      $.ajax({
        type: 'POST',
        url: '/cart/change.js',
        dataType: 'json',
        data: {
          id: product,
          properties: {
            '_csa_builder': category
          },
          quantity: 0
        },
        success: function (res) {
          var builder_count = parseInt(builder_cart_count.html()),
              builder_header_steps = $('.wayfx-builder-header__step'),
              builder_header_step = $('.wayfx-builder-header__step[data-step="'+ step +'"]'),
              builder_body_step = $(".wayfx-builder__step[data-step='" + step + "']");
          builder_header_steps.removeClass('current');
          builder_header_step.removeClass('completed').addClass('incomplete');
          builder_body_step.removeClass("completed").addClass("incomplete");
          builder_body_step.attr('data-selected-title', '')
          builder_body_step.find('.wayfx-builder__step-product').html('You still need to select a product');
          $(e).removeClass("btn--remove").addClass("btn--add").find('.wayfx-text').html('Add to Bag');
          builder_count = builder_count - 1;
          builder_cart_count.html(builder_count);
          if(builder_count === 0) {
           $('.wayfx-builder-header__icon').removeClass('wayfx-builder-header__cart--badge');
          }
          $('.wayfx-builder__success').hide();
        }
      });
  } else {
      var wayfx_active_item = $(".wayfx-builder__step[data-step='" + step + "'] .btn--remove"),
          wayfx_active_id = wayfx_active_item.data('product-id');

      if(wayfx_active_item.length) {
        $.ajax({
          type: 'POST',
          url: '/cart/change.js',
          dataType: 'json',
          data: {
            id: parseInt(wayfx_active_id),
            quantity: 0,
            properties: {
              '_csa_builder': category
            }
          },
          success: function (res) {
            addItem(step, product, title, category, true);
          }
        });
      } else {
        addItem(step, product, title, category);
      }
  }
}

function copyDiscount(promoInput, promo) {
  var $promoInput = document.getElementsByClassName(promoInput)[0];
  $promoInput.select();
  $promoInput.setSelectionRange(0, 99999);
  document.execCommand("copy");
  window.location.href = '/collections/all?discount=' + promo;
}

function addToCart(form_id) {
  $.ajax({
    type: 'POST',
    url: '/cart/add.js',
    dataType: 'json',
    data: $('#'+form_id).serialize(),
    success: addToCartSuccess(form_id),
    error: addToCartFail
  });
}

$('.wayfx-product__grid-variant select').on('change', function() {
  var price = $('option:selected',this).data("price");
  $(this).parent().next('.wayfx-product__grid-price').html(price);
});

// TODO: remove the wayfx version above after removing up product-grid-item.liquid file
$('.product__grid-variant select').on('change', function() {
  var price = $('option:selected',this).data("price");
  $(this).parent().next('.product__grid-price').html(price);
});

function addToCartSuccess(product) {
  setTimeout(function(){
    window.GlobalCartMain.updateData()
    window.globalSideBarUI__cart.open()
  }, 500);
}

function addToCartFail(obj, status) {
  console.log('Add to Cart Failed...');
}

// Smooth Scrolling
$('a[href*="#"]')
.not('[href="#"]')
.not('[href="#0"]')
.click(function(event) {
  if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
    var target = $(this.hash);
    target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
    if (target.length) {
      event.preventDefault();
      $('html, body').animate({
        scrollTop: target.offset().top - $('.wayfx-header').outerHeight() - 32
      }, 600, function() {
        var $target = $(target);
        $target.focus();
        if ($target.is(":focus")) {
          return false;
        } else {
          $target.attr('tabindex','-1');
          $target.focus();
        }
      });
    }
  }
});

 $(document).ready(function () {
   var searchWrapper = $(".wayfx-header__search"),
       searchForm = $(".wayfx-header__search form"),
       searchInput = $(".wayfx-header__search input"),
       searchButtonOpen = $("#wayfxSearchTrigger"),
       searchButtonClose = $("#wayfxSearchClose"),
       searchBackButtonClose = $("#wayfxSearchBackClose");

   var mobileNavMenu = $(".wayfx-mobile__nav"),
       mobileNavTrigger = $("#wayfxNavTrigger"),
       mobileNavClose = $("#wayfxMobileNavClose"),
       mobileNavMenuBack = $("#wayfxMobileNavBack"),
       mobileNavMenuLevel = $(".wayfx-mobile__level"),
       mobileNavMenuLevel0 = $(".wayfx-mobile__level0"),
       mobileNavMenuLevel1 = $(".wayfx-mobile__level1"),
       mobileNavMenuLevel2 = $(".wayfx-mobile__level2"),
       mobileNavLinkLevel0 = $(".wayfx-mobile__level0-link > .wayfx-mobile__level-title"),
       mobileNavLinkLevel1 = $(".wayfx-mobile__level1-link > .wayfx-mobile__level-title"),
       mobileNavMenuLevelLinks = $(".wayfx-mobile__level-links"),
       mobileNavMenuHeading = $(".wayfx-mobile__heading-center");

   mobileNavTrigger.on("click", function() {
     mobileNavMenu.fadeIn(100);
     document.body.style.overflowY = 'hidden'
   });

   mobileNavMenuBack.on("click", function() {
     var backMenu = parseInt($(this).attr('data-back-menu')),
         backCategory = $(this).attr('data-category'),
         backTitle = $(this).attr('data-back-title');

     if(backMenu === 0) {
       mobileNavMenuBack.hide();
       mobileNavMenuHeading.html('');
       mobileNavMenuLevel1.hide();
       $('.wayfx-header__extra-links--mobile').show();
     };

     if(backMenu === 1) {
       mobileNavMenuBack.attr('data-back-menu', '0');
       mobileNavMenuHeading.html(backCategory);
       $("[data-nav-body='"+ backTitle +"']").hide();
     }
   });

   mobileNavClose.on("click", function() {
     mobileNavMenu.fadeOut(100);
     mobileNavMenuBack.hide().attr('data-back-menu', '0');
     mobileNavMenuHeading.html('');
     $('.wayfx-header__extra-links--mobile').show();
     document.body.style.overflowY = 'auto'
     setTimeout(function(){
       mobileNavMenuLevel.hide();
       mobileNavMenuLevel0.show();
     }, 200);
   });

   mobileNavLinkLevel0.on("click", function() {
     var title = $(this).data('nav-title');
     mobileNavMenuBack.fadeIn().attr('data-back-menu', '0');
     mobileNavMenuBack.attr('data-back-title', title);
     mobileNavMenuBack.attr('data-category', title);
     mobileNavMenuHeading.html(title).fadeIn(100);
     $('.wayfx-header__extra-links--mobile').hide();
     //$(this).find('.wayfx-mobile__level-title').hide();
     $(this).next('.wayfx-mobile__level1').fadeIn(100);
   });


   mobileNavLinkLevel1.on("click", function() {
     var title = $(this).data('nav-title');
     mobileNavMenuBack.attr('data-back-menu', '1');
     mobileNavMenuBack.attr('data-back-title', title);
     mobileNavMenuHeading.html(title).fadeIn(100);
     $(this).next('.wayfx-mobile__level2').fadeIn(100);
   });

   $(".wayfx-header__has-dropdown").hover(
     function () {
       $(this).find('.wayfx-header__dropdown').stop(true, true).fadeIn(200);
     },
     function () {
       $(this).find('.wayfx-header__dropdown').stop(true,true).hide();
     }
   );


   searchButtonOpen.on("click", function() {
     searchForm.fadeIn(100);
     searchWrapper.addClass('wayfx-header__search--triggered');
     searchInput.focus();
   });

   searchButtonClose.on("click", function() {
     searchForm.fadeOut(100);
     searchWrapper.removeClass('wayfx-header__search--triggered');
   });

   searchBackButtonClose.on("click", function() {
     searchForm.fadeOut(100);
     searchWrapper.removeClass('wayfx-header__search--triggered');
   });

   searchInput.focusin(function() {
     $(this).parent('form').addClass("wayfx-header__search-active");
   });

   searchInput.focusout(function() {
     $(this).parent('form').removeClass("wayfx-header__search-active");
   });

   $(document).mouseup(function (e) {
     if ($(e.target).closest(searchForm).length === 0) {
       searchForm.fadeOut(100);
       searchWrapper.removeClass('wayfx-header__search--triggered');
     }
   });
 });


!function(a){function b(b,c,d){b.on("mousedown.ba-events touchstart.ba-events",function(e){b.addClass("ba-draggable"),c.addClass("ba-resizable");var f=e.pageX?e.pageX:e.originalEvent.touches[0].pageX,g=b.outerWidth(),h=b.offset().left+g-f,i=d.offset().left,j=d.outerWidth();minLeft=i+10,maxLeft=i+j-g-10,b.parents().on("mousemove.ba-events touchmove.ba-events",function(b){var c=b.pageX?b.pageX:b.originalEvent.touches[0].pageX;leftValue=c+h-g,leftValue<minLeft?leftValue=minLeft:leftValue>maxLeft&&(leftValue=maxLeft),widthValue=100*(leftValue+g/2-i)/j+"%",a(".ba-draggable").css("left",widthValue),a(".ba-resizable").css("width",widthValue)}).on("mouseup.ba-events touchend.ba-events touchcancel.ba-events",function(){b.removeClass("ba-draggable"),c.removeClass("ba-resizable"),a(this).off(".ba-events")}),e.preventDefault()})}a.fn.beforeAfter=function(){var c=this,d=c.width()+"px";c.find(".resize img").css("width",d),b(c.find(".handle"),c.find(".resize"),c),a(window).resize(function(){var a=c.width()+"px";c.find(".resize img").css("width",a)})}}(jQuery);

$('.ba-slider').each(function(){
     $(this).beforeAfter();
});

$(document).ready(function() {

  $('.print-button').on("click", function(e) {
  	e.preventDefault();
    window.print();
  });

  $(".wayfx-block--faq .wayfx-block--faq__title").on( "click", function() {
    $(this).parent().toggleClass('wayfx-block--faq--open');
    $(this).next('.wayfx-block--faq__content').slideToggle(100);
  });


  $(".wayfx-block__tab").on( "click", function() {
    const tab = $(this).data('tab');
    if(!$(this).hasClass('selected')) {
      $(".wayfx-block__tab").removeClass('selected');
      $(this).addClass('selected');
      // console.log(tab);
      if(tab === 'login') {
        $('.wayfx-block__register-form').hide();
        $('.wayfx-block__login-form').fadeIn();
      } else {
        $('.wayfx-block__login-form').hide();
        $('.wayfx-block__register-form').fadeIn();
      }
    }
  });

  var hash= window.location.hash

  if (hash == '' || hash == '#' || hash == undefined) return false;

  var target = $(hash);

  headerHeight = $('.wayfx-header').outerHeight();

  target = target.length ? target : $('[name=' + hash.slice(1) +']');

  if (target.length) {
    $('html,body').stop().animate({
      scrollTop: target.offset().top - headerHeight - 32
    }, 'linear');

  }

});

$(wayfx.init);

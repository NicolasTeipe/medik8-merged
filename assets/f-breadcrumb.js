
    let localStorageKey = 'f-breadcrumbs';

    window.addEventListener('DOMContentLoaded', () => {
      
      const isProductPage = window.location.href.includes('/products/');

      if (isProductPage) {
        const previousURL = document.referrer;

        // debug to view in dev for new template. Irrelvent check when live
        if(window.location.href.includes('?view=v2')){
            addCollectionBreadcrumb()
        }else{
            if (previousURL && previousURL.includes('/collections/')) {
                addCollectionBreadcrumb();
            }else{
                removePreviousBreadcrumbs();
            }
        }

      }

      document.querySelectorAll('a[href*="/products/"]').forEach((item) => {
        item.addEventListener('click', (event) => {
          localStorage.removeItem(localStorageKey);
        });
      });

      document.querySelectorAll('#PageContainer .wayfx-products a[href*="/products/"]').forEach((item) => {
        removeEventListener('click', this);
        item.addEventListener('click', (event) => {
          saveBreadcrumbs();
        });
      });


    });


    function removePreviousBreadcrumbs() {
        localStorage.removeItem(localStorageKey);
    }

      function saveBreadcrumbs() {

        const currentURL = window.location.href;
        const pageTitle = cleanTitle(document.querySelector('h1')?.textContent || '');
    
        if (currentURL.includes('/collections/')) {
          removePreviousBreadcrumbs();
    
          const breadcrumbs = {
            collection: {
              title: pageTitle,
              url: currentURL,
            },
          };
    
          localStorage.setItem(localStorageKey, JSON.stringify(breadcrumbs));
        }
      }


      function cleanTitle(title) {
        return title.replace(/[\r\n]+/g, '').replace(/^Collection:\s+/i, '').trim().replace(/Collection:\s+/i, '');
      }

  
      function addCollectionBreadcrumb() {
        const previousCollection = localStorage.getItem('f-breadcrumbs');

        if (previousCollection) {
          const breadcrumbs = JSON.parse(previousCollection);
          const { title, url } = breadcrumbs.collection;
          if (title && url) {

            const breadCrumbParent = document.querySelector('nav.breadcrumbs')
            
            const ulElement = breadCrumbParent.querySelector('ul, ol');
    
            if (ulElement) {
              const previousURL = document.referrer;
    
                if (!window.location.href.includes('?view=v2') && previousURL && previousURL.includes('/products/')) {
                    // Don't add the element if the previous URL has 'products' in it
                    return;
                }

              const firstLiElement = ulElement.querySelector('li:first-child');
              const liElement = document.createElement('li');
              const aElement = document.createElement('a');

              liElement.classList.add('breadcrumbs__item');

              aElement.href = url;
              aElement.classList.add('breadcrumbs__link');
              aElement.textContent = title;
            
              if (firstLiElement) {
                ulElement.insertBefore(liElement, firstLiElement.nextSibling);
              } else {
                ulElement.appendChild(liElement);
              }

              liElement.appendChild(aElement);

            }
            
          }
        }
      }
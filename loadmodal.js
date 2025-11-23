/**
 * Author: Conan C. Albrecht <ca@byu.edu>
 * License: MIT
 * Version: 2.0.0
 *
 * Dependencies:
 *   - Bootstrap 5 (tested against v5)
 */

(function (window) {
  'use strict';

  window.loadmodal = function (options) {
    // allow a simple url to be sent as the single option
    if (typeof options === 'string') {
      options = {
        url: options,
      };
    }

    // default options
    const defaults = {
      url: null,
      id: 'loadmodal-js',
      idBody: 'loadmodal-js-body',
      prependToSelector: null,
      appendToSelector: null,
      title: document.title || 'Dialog',
      width: '400px',
      dlgClass: 'fade',
      size: 'modal-lg',
      closeButton: true,
      buttons: {},
      modal: {
        keyboard: false,
      },
      fetch: {
        method: 'GET',
      },
      onSuccess: null,
      onCreate: null,
      onShow: null,
      onClose: null,
    };

    // merge options
    const userFetch = options.fetch || {};
    const userModal = options.modal || {};

    options = Object.assign({}, defaults, options);

    // Deep merge for fetch and modal options
    options.fetch = Object.assign({}, defaults.fetch, userFetch);
    options.modal = Object.assign({}, defaults.modal, userModal);


    // ensure we have a url
    options.url = options.fetch.url || options.url;
    if (!options.url) {
      throw new Error('loadmodal requires a url.');
    }

    // ensure callbacks are arrays
    const forceFuncArray = (ar) => {
      if (!ar) return [];
      if (Array.isArray(ar)) return ar;
      return [ar];
    };

    options.onSuccess = forceFuncArray(options.onSuccess);
    options.onCreate = forceFuncArray(options.onCreate);
    options.onShow = forceFuncArray(options.onShow);
    options.onClose = forceFuncArray(options.onClose);

    // close any dialog with this id first
    const existingModalEl = document.getElementById(options.id);
    if (existingModalEl) {
      const existingModal = bootstrap.Modal.getInstance(existingModalEl);
      if (existingModal) {
        existingModal.hide();
      } else {
          // If instance not found but element exists, remove it
          existingModalEl.remove();
      }
    }

    // Perform the fetch
    const fetchPromise = fetch(options.url, options.fetch)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then((data) => {
        // call onSuccess methods
        for (const func of options.onSuccess) {
          const ret = func(data);
          if (ret === false) return Promise.reject('cancelled');
          if (typeof ret === 'string') data = ret;
        }

        // create the modal html
        const div = document.createElement('div');
        div.id = options.id;
        div.className = `modal ${options.dlgClass} loadmodal-js`;
        div.tabIndex = -1; // Bootstrap 5 uses -1 usually
        div.setAttribute('aria-labelledby', `${options.id}-title`);
        // div.setAttribute('aria-hidden', 'true'); // BS5 adds this automatically

        const closeButtonHtml = options.closeButton
          ? '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'
          : '';

        div.innerHTML = `
          <div class="modal-dialog ${options.size}">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="${options.id}-title">${options.title}</h5>
                ${closeButtonHtml}
              </div>
              <div class="modal-body" id="${options.idBody}">
                ${data}
              </div>
            </div>
          </div>
        `;

        // add the new modal div to the body
        if (options.prependToSelector) {
             const el = document.querySelector(options.prependToSelector) || document.body;
             el.insertBefore(div, el.firstChild);
        } else if (options.appendToSelector) {
             const el = document.querySelector(options.appendToSelector);
             if (el) el.appendChild(div);
             else document.body.appendChild(div);
        } else {
             // Default prepend to body (as per original logic "prepend to body is usually preferred")
             document.body.insertBefore(div, document.body.firstChild);
        }

        // Set width if specified (applied to modal-dialog)
        if (options.width) {
             const dialog = div.querySelector('.modal-dialog');
             if (dialog) dialog.style.width = options.width;
             // Note: BS5 handles width via max-width usually, but we'll set width directly as requested.
             // However, BS5 responsive classes (modal-lg) are preferred.
        }


        // add buttons
        if (Object.keys(options.buttons).length > 0) {
            const modalBody = div.querySelector('.modal-body');
            // Or use a custom panel inside body? Original used .button-panel inside body.
            // Let's stick to original behavior: append to body.
            // But wait, original appended to .modal-body.
            const btnPanel = document.createElement('div');
            btnPanel.className = 'mt-3 text-end'; // Add some spacing

            let buttonClass = 'btn btn-primary';

            for (const [key, func] of Object.entries(options.buttons)) {
                const button = document.createElement('button');
                button.className = buttonClass;
                button.textContent = key;
                button.type = 'button';

                button.addEventListener('click', (evt) => {
                    let closeDialog = true;
                    if (func && func(evt) === false) {
                        closeDialog = false;
                    }
                    if (closeDialog) {
                        const instance = bootstrap.Modal.getInstance(div);
                        if (instance) instance.hide();
                    }
                });

                btnPanel.appendChild(button);
                // Add spacing between buttons
                btnPanel.appendChild(document.createTextNode(' '));

                buttonClass = 'btn btn-secondary'; // subsequent buttons
            }
            modalBody.appendChild(btnPanel);
        }

        // Z-index handling
        // BS5 handles z-index well, but if we want to ensure it's on top:
        // Calculate max z-index
        // This is a bit complex in vanilla without jQuery's selectors.
        // skipping z-index manual adjustment unless requested, as BS5 manages it via backdrop.


        // Trigger onCreate
        for (const func of options.onCreate) {
             if (func.call(div, data) === false) return Promise.reject('cancelled');
        }

        // Create Bootstrap Modal instance
        const modalInstance = new bootstrap.Modal(div, options.modal);

        // Event listeners
        div.addEventListener('shown.bs.modal', (event) => {
            // Autofocus
            const autofocusEl = div.querySelector('[autofocus]');
            if (autofocusEl) {
                autofocusEl.focus();
            } else {
                const firstInput = div.querySelector('.modal-body :is(input, select, textarea, button):not([disabled])'); // Simplified
                 if (firstInput) firstInput.focus();
            }

            // callbacks
            for (const func of options.onShow) {
                func.call(div, event);
            }
        });

        div.addEventListener('hidden.bs.modal', (event) => {
             for (const func of options.onClose) {
                 func.call(div, event);
             }
             modalInstance.dispose();
             div.remove();
        });

        // Show the modal
        modalInstance.show();

        return div; // Return the DOM element
      });


    // Add methods to the promise
    fetchPromise.create = function (func) {
      options.onCreate.push(func);
      return this;
    };
    fetchPromise.show = function (func) {
      options.onShow.push(func);
      return this;
    };
    fetchPromise.close = function (func) {
      options.onClose.push(func);
      return this;
    };

    return fetchPromise;
  };
})(window);

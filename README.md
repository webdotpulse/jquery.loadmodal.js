# loadmodal.js

Author: Conan C. Albrecht <ca@byu.edu>
License: MIT

## Dependencies

- Bootstrap 5 (JS and CSS)

## Description

A vanilla JavaScript plugin to open a Bootstrap 5 modal (dialog) with content loaded via Ajax (Fetch API).
Normally, Bootstrap requires that you manually create the dialog `<div>`s before loading content into it. This plugin creates the modal divs for you and makes it easier to call dialogs directly from Javascript without any corresponding HTML.

## Usage

### Simple example

```javascript
loadmodal('/your/server/url/');
```

### Advanced example

```javascript
loadmodal({
  url: '/your/server/url',
  id: 'my-modal-id',
  title: 'My Title',
  width: '400px',
  closeButton: false,
  buttons: {
    "OK": function() {
      // do something here
      // a false return here cancels the automatic closing of the dialog
    },
    "Cancel": false,   // no-op - just having the option makes the dialog close
  },
  modal: {
    keyboard: false,
    // any other options from the regular new bootstrap.Modal() call (see Bootstrap docs)
  },
  fetch: {
    method: 'GET',
    // any other options from the regular fetch() call (see MDN docs)
  },

}).create(function(data) {
    console.log('Modal is created but not yet visible.')

}).show(function(event) {
    console.log('Modal is now showing.')

}).close(function(event) {
    console.log('Modal just closed!')

}).then(function(element) {
    console.log('Ajax response is here, modal is created.');
});
```

### Closing a dialog

This is standard Bootstrap 5:

```javascript
var myModalEl = document.getElementById('my-modal-id');
var modal = bootstrap.Modal.getInstance(myModalEl);
modal.hide();
```

## Options

- `url`: The URL to fetch content from.
- `id`: The ID of the modal element (default: `loadmodal-js`).
- `title`: The title of the modal.
- `width`: CSS width for the dialog (default: `400px`).
- `size`: Bootstrap modal size class (e.g., `modal-lg`, `modal-sm`).
- `closeButton`: Whether to show the close button (default: `true`).
- `buttons`: Object of button labels and callback functions.
- `modal`: Options passed to `new bootstrap.Modal()`.
- `fetch`: Options passed to `fetch()`.
- `onSuccess`, `onCreate`, `onShow`, `onClose`: Callbacks.

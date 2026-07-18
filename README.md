# UPI QR

A privacy-first, browser-based generator for styled UPI payment QR cards.

## Features

- Generates `upi://pay` QR codes entirely in the browser
- Indian-numbering amount formatting and amount-in-words display
- Download as JPEG or share through the Web Share API
- Multiple card themes
- Remembers the most recently used details in the current browser for reuse

## Run locally

This is a static site with no build step or server dependency.

1. Clone or download this repository.
2. Open `index.html` in a modern browser.

For the best browser compatibility, you can serve the folder with any static-file server.

## Privacy

Payment details are encoded only into the generated QR card. The app does not send those details to a server. The last-used form data is stored in the browser's `localStorage` so it can be reused on the same device and browser.

## Project structure

```text
index.html       Application markup
style.css        Interface styling and responsive layout
app.js           Form state, QR rendering, sharing, and local persistence
qrcode.min.js    Bundled QR-code generation library
favicon.svg      Application favicon
```

## Deployment

The project can be deployed directly with GitHub Pages: publish the repository root from the desired branch. No build command is required.

## License

No license has been selected yet. Add one before distributing or accepting external contributions.

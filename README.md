# CI² Command Center — v0.2 Offline PWA

This build converts the v0.1 shell into an installable Progressive Web App.

## What changed
- Web app manifest
- Standalone/full-screen-style launch behavior
- Service worker that caches the app shell for offline use
- CI² app icon
- Existing project/A3/observation/action prototype preserved
- Prototype data still persists locally in the browser

## Important
A service worker cannot be installed from an ordinary Files preview or `file://` URL.
The folder must first be served over HTTPS (or localhost during desktop development).
Once hosted and opened successfully in Safari, use Share → Add to Home Screen.
After the service worker has cached the shell, the app can launch offline.

## Next development steps
1. Map the user's completed A3 into the information architecture.
2. Replace localStorage with IndexedDB.
3. Add structured project export/import.
4. Add richer CI² analysis tools.
5. Later add authenticated cloud sync for production sharing.

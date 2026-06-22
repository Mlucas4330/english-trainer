# English Trainer — Chrome/Edge extension

A Manifest V3 **side-panel** extension (React + Tailwind, editorial style). Click the
toolbar icon to open the trainer in the browser side panel; set your Anthropic
API key in the in-app **settings** tab.

## Build & load

```bash
npm install
npm run build
```

This produces a `dist/` folder. Then:

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the `dist/` folder.
4. Click the toolbar icon — the trainer opens in the side panel. Open the **settings** tab and paste your Anthropic API key. Get one at <https://console.anthropic.com> → API keys.

After changing code, re-run `npm run build` and hit the reload icon on the extension card.

## How it works

- `popup.html` + `src/main.jsx` → `src/App.jsx` is the whole UI, loaded as the side panel (`side_panel.default_path` in the manifest). `public/background.js` is a tiny service worker that makes clicking the toolbar icon open the panel (`openPanelOnActionClick`). Settings (the API key) is a tab inside the app, stored in `chrome.storage.local`.
- `src/App.jsx` reads that key and calls the Anthropic API directly from the browser, using the `anthropic-dangerous-direct-browser-access: true` header. The model is `claude-sonnet-4-6` (change it in `callClaude` if you like).
- Styling is Tailwind (`tailwind.config.js`, `postcss.config.js`, `src/index.css`), compiled to a static CSS file at build time (no runtime/CDN, so it stays within the extension CSP).
- `public/manifest.json` is copied to `dist/` as-is at build time.

## Notes

- **Microphone / recording.** The side panel stays open when it loses focus (unlike the old popup), so the mic permission prompt no longer kills the recording — Speaking gym recording works in the panel. The Speaking gym still has an **"open in a full tab for recording"** link as a fallback for any environment where the panel can't get mic access.
- **Fonts.** Editorial style uses Georgia (serif headings) + the system sans stack — all OS-installed, so nothing is fetched remotely (MV3 blocks remote fonts/stylesheets).
- **Icons.** No custom toolbar icon is set, so the browser shows a default placeholder. Add an `icons` block to `manifest.json` pointing at PNGs in `public/` when you have artwork.

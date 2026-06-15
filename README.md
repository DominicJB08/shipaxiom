# Ship Axiom

Demo website for `shipaxiom.com`.

Ship Axiom is positioned as a privacy-first local AI operations studio that maps repetitive admin work, recommends the safest local-AI wedge, and ships a 7-day pilot with human review.

Live site:

- https://shipaxiom.com
- https://www.shipaxiom.com

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Capture Demo

```bash
SITE_URL=https://shipaxiom.com npm run capture
```

## Deploy

```bash
npm run deploy
```

The site is configured as a Cloudflare Worker with static assets in `wrangler.jsonc`, routed to:

- `shipaxiom.com`
- `www.shipaxiom.com`

## Demo Assets

- `demo/concept.png`: generated full-page design concept used as the visual spec.
- `demo/screenshots/desktop-fullpage.png`: deployed desktop capture.
- `demo/screenshots/mobile-fullpage.png`: deployed mobile capture.
- `demo/videos/shipaxiom-demo.mp4`: deployed-site screen recording.
- `demo/qa-results.json`: capture-time responsive QA checks.
- `public/images/local-ai-workstation.png`: generated hero/supporting raster asset.

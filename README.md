# Ship Axiom

Lead-capture website for `shipaxiom.com`.

Ship Axiom is positioned as a privacy-first AI workflow studio that maps repetitive admin work, recommends the safest private deployment path, and ships a first workflow without requiring an up-front AI PC install.

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

## View Leads

Submitted audit requests are stored in Cloudflare D1.

```bash
npm run leads
```

## Capture Demo

```bash
SITE_URL=https://shipaxiom.com npm run capture
```

## Regenerate Workflow Video

```bash
npm run workflow-video
```

## Deploy

```bash
npm run deploy
```

The site is configured as a Cloudflare Worker with static assets in `wrangler.jsonc`, routed to:

- `shipaxiom.com`
- `www.shipaxiom.com`

The intake API is served by the same Worker at `/api/leads` and stores submissions in the `shipaxiom-leads` D1 database.

## Offer Research

See `docs/offer-research.md` for the pricing and delivery-model rationale.

## Demo Assets

- `demo/concept.png`: generated full-page design concept used as the visual spec.
- `demo/screenshots/desktop-fullpage.png`: deployed desktop capture.
- `demo/screenshots/mobile-fullpage.png`: deployed mobile capture.
- `demo/videos/shipaxiom-demo.mp4`: deployed-site screen recording.
- `demo/qa-results.json`: capture-time responsive QA checks.
- `public/media/workflow-demo.mp4`: embedded workflow explainer video.
- `public/media/workflow-demo.webm`: embedded workflow explainer video fallback.
- `public/media/workflow-demo-poster.jpg`: poster frame for the embedded video.
- `public/images/local-ai-workstation.png`: generated hero/supporting raster asset.

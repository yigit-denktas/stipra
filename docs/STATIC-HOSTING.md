# Static hosting

The primary studio remains `https://apps.yigitdenktas.com/stipra/`. Cloudflare's existing `yigitdenktas-apps` project watches this repository's `main` branch, runs `npm run build:pages` and serves `dist`. That build places the app at `dist/stipra/index.html` and the reproduction guide at `dist/stipra/guide/index.html`.

The separate GitHub Pages workflow builds the same source, stages the **contents** of `dist/stipra` at `dist-github`, and deploys that directory. This avoids `/stipra/stipra/` when GitHub mounts a project site at `/stipra/`. Guide navigation and assets use relative paths; canonical links retain the primary app address. Do not add a CNAME or change DNS. Account-level GitHub Pages custom-domain inheritance may affect the mirror's final URL; use the actual deployment URL reported by the workflow.

Enable the repository's **Settings → Pages → Build and deployment → Source: GitHub Actions**, if it is not already enabled. Then merge the workflow or run **Publish GitHub Pages mirror** manually on an approved branch. The workflow uses GitHub's Pages artifact/deploy actions and a `github-pages` environment; CI remains a separate workflow. A build or workflow file alone is not proof that a live site has been activated.

```sh
npm install --no-audit --no-fund
npm run build:github-pages
```

Cloudflare-specific `_headers` and `_redirects` stay outside the GitHub project root. The app carries its no-network processing CSP in HTML for both hosts; Cloudflare also applies its response headers. Only the allowlisted static app, guide, fonts and photo-free identity specimens enter these builds. Owner inputs, private reports and their output directories are never copied.

The QR destination should be verified after the primary deployment completes. Before merging/deploying, inspect the guide preview and confirm the studio link, replay instructions, browser smoke and QR decoding checks. No hosting action changes the source photo's redistribution rights.

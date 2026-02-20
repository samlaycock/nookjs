---
"nookjs": patch
---

Pin CI/release toolchain versions and enforce frozen lockfile installs.

This pins GitHub Actions Bun setup versions, pins the website deploy Wrangler action version, pins `@types/bun` in `package.json`, and updates workflow install steps to use `bun install --frozen-lockfile` for more reproducible CI and release runs.

---
"nookjs": minor
---

Improve the simplified sandbox API and onboarding experience:

- add safe default per-run limits for `createSandbox()` (`callDepth`, `loops`, `memoryBytes`)
- add first-class `timeoutMs` support for async `run()` and `runModule()` (sandbox default + per-call override)
- add typed generics for `run`, `runSync`, and `runModule` return values
- add a `test` script to `package.json`
- migrate examples to the simplified API and move internal `Interpreter` usage to `examples/internal`
- document timeout support, safe defaults, typed run helpers, and example organization

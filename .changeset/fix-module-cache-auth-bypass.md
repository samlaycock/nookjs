---
"nookjs": patch
---

Fix P0 security vulnerability: module cache authorization bypass. The module cache was checked by raw specifier before resolver authorization was applied, allowing an attacker to import a module cached by a previously authorized importer. Now the resolver is always called first before cache access, and the cache key uses the resolved path instead of the specifier.

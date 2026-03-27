---
"nookjs": patch
---

Strip TypeScript `abstract` class modifiers and runtime-less abstract class members so abstract
hierarchies parse in strip mode and execute like their plain JavaScript runtime equivalents.

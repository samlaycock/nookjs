---
"nookjs": patch
---

Strip TypeScript generic parameter lists on functions, classes, and class methods so strip-mode
parsing accepts common signatures like `function id<T>() {}` and `class Box<T> {}` without changing
runtime behavior.

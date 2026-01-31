# nookjs

## 0.1.0

### Minor Changes

- 3c91593: Added `ResourceTracker` class for cumulative resource tracking and attribution in multi-tenant environments. The new feature enables host applications to monitor and limit aggregate resource consumption across multiple evaluations, with support for memory, iterations, function calls, CPU time, and evaluation count limits. Includes `ResourceExhaustedError` for error handling and comprehensive history tracking for analytics.

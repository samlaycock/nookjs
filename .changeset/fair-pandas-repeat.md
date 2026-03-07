"nookjs": patch
---

Enforce integrated `maxCpuTime` limits during evaluation so a single run cannot materially overshoot the configured wall-clock budget before resource exhaustion is reported.

export interface BenchmarkResult {
  name: string;
  timeMs: number;
  opsPerSecond: number;
}

export interface ComparisonResult extends BenchmarkResult {
  baselineTimeMs?: number;
  baselineOpsPerSecond?: number;
  slowdown?: number;
}

export function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatOps(ops: number): string {
  if (ops >= 1_000_000) return `${(ops / 1_000_000).toFixed(2)}M/s`;
  if (ops >= 1_000) return `${(ops / 1_000).toFixed(2)}K/s`;
  return `${ops.toFixed(0)}/s`;
}

export function formatTable(
  results: (BenchmarkResult | ComparisonResult)[],
  showBaseline = false,
): string {
  let nameW = 30;
  let timeW = 12;
  let baselineW = 0;
  let opsW = 12;

  for (const r of results) {
    nameW = Math.max(nameW, r.name.length);
    timeW = Math.max(timeW, formatTime(r.timeMs).length);
    opsW = Math.max(opsW, formatOps(r.opsPerSecond).length);
  }

  if (showBaseline) {
    baselineW = 12;
    for (const r of results) {
      const cr = r as ComparisonResult;
      if (cr.baselineTimeMs !== undefined) {
        baselineW = Math.max(baselineW, formatTime(cr.baselineTimeMs).length);
      }
    }
  }

  if (showBaseline) {
    const header = `  ${"Benchmark".padEnd(nameW)}  ${"Time".padStart(timeW)}  ${"Baseline".padStart(baselineW)}  ${"Ops/sec".padStart(opsW)}`;
    const line = `  ${"-".repeat(nameW)}  ${"-".repeat(timeW)}  ${"-".repeat(baselineW)}  ${"-".repeat(opsW)}`;
    const rows = results.map((r) => {
      const cr = r as ComparisonResult;
      const baseline =
        cr.baselineTimeMs !== undefined ? formatTime(cr.baselineTimeMs) : "";
      const nameStr = r.name.padEnd(nameW);
      const timeStr = formatTime(r.timeMs).padStart(timeW);
      const baselineStr = baseline.padStart(baselineW);
      const opsStr = formatOps(r.opsPerSecond).padStart(opsW);
      return `  ${nameStr}  ${timeStr}  ${baselineStr}  ${opsStr}`;
    });
    return [header, line, ...rows].join("\n");
  } else {
    const header = `  ${"Benchmark".padEnd(nameW)}  ${"Time".padStart(timeW)}  ${"Ops/sec".padStart(opsW)}`;
    const line = `  ${"-".repeat(nameW)}  ${"-".repeat(timeW)}  ${"-".repeat(opsW)}`;
    const rows = results.map((r) => {
      const nameStr = r.name.padEnd(nameW);
      const timeStr = formatTime(r.timeMs).padStart(timeW);
      const opsStr = formatOps(r.opsPerSecond).padStart(opsW);
      return `  ${nameStr}  ${timeStr}  ${opsStr}`;
    });
    return [header, line, ...rows].join("\n");
  }
}

export function formatSummary(
  results: { name: string; slowdown?: number; timeMs?: number }[],
): string {
  const valid = results.filter(
    (r): r is { name: string; slowdown: number } => r.slowdown !== undefined,
  );
  if (valid.length === 0) return "";

  const avg = valid.reduce((sum, r) => sum + r.slowdown, 0) / valid.length;
  const min = Math.min(...valid.map((r) => r.slowdown));
  const max = Math.max(...valid.map((r) => r.slowdown));
  const fastest = valid.reduce((a, b) => (a.slowdown < b.slowdown ? a : b));
  const slowest = valid.reduce((a, b) => (a.slowdown > b.slowdown ? a : b));

  return `
----------------------------------------
SUMMARY
----------------------------------------
Average slowdown: ${avg.toFixed(2)}x
Range: ${min.toFixed(2)}x - ${max.toFixed(2)}x

Fastest: ${fastest.name} (${fastest.slowdown.toFixed(2)}x)
Slowest: ${slowest.name} (${slowest.slowdown.toFixed(2)}x)
`;
}

# Performance Budget

Last Updated: 2026-03-04

## 1. Benchmark Environment

Primary baseline:
- CPU: 4 physical cores
- RAM: 16 GB
- Storage: SSD
- Browser: latest stable Chrome
- Mode: no network dependency for core conversion path

Secondary validation:
- Latest stable Edge, Firefox, Safari for compatibility

## 2. Stage Budgets

| Stage | Budget (p95) | Notes |
|---|---|---|
| Ingest + validate | <=300 ms | File checks and asset normalization |
| Render + extract | <=1500 ms | Includes style snapshot capture |
| Analyze + map | <=1800 ms | CSS support tiering and object graph build |
| Package PPTX | <=1200 ms | OOXML generation and zip assembly |
| Total conversion | <=5000 ms | Typical class: 10 slides, <=2000 elements |

## 3. UI Responsiveness Budget

- First meaningful feedback after upload: <=150 ms.
- Main-thread long tasks over 50 ms during conversion: <=2.
- Cancellation response: <=500 ms.

## 4. Memory and Size Budgets

- Peak memory during typical conversion: <=600 MB.
- Hard safety cutoff: 800 MB with graceful failure.
- Output PPTX size for reference fixture set: <=20 MB.

## 5. Regression Policy

- Performance regression gate: <=10% slowdown versus rolling baseline median.
- Any budget breach on main fixture class blocks release.
- Exceptions require documented approval and target fix sprint.

## 6. Required Metrics Per Run

- `time_ingest_ms`
- `time_extract_ms`
- `time_analyze_ms`
- `time_package_ms`
- `time_total_ms`
- `main_thread_long_tasks`
- `peak_memory_mb`
- `output_size_mb`

## 7. Reporting

Each release candidate must include:
- Benchmark summary table.
- Comparison against previous release baseline.
- Top regressions and mitigation plan.

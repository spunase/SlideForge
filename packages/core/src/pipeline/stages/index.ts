/**
 * Barrel export for all pipeline stages.
 */

export { ingest } from './ingest';
export type { IngestResult } from './ingest';

export { render } from './render';
export type { RenderResult } from './render';

export { extract } from './extract';
export type { ExtractResult } from './extract';

export { analyze } from './analyze';
export type { AnalyzeResult } from './analyze';

export { build } from './build';
export type { BuildResult } from './build';

export { packageSlides } from './package';
export type { PackageResult } from './package';

export { buildReport } from './report';
export type { ReportInput } from './report';

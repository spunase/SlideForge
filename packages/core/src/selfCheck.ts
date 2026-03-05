import { convert } from './convert';
import type {
  ConversionOptions,
  ConversionResult,
  ProgressInfo,
  SelfCheckExpectations,
  SelfCheckFix,
  SelfCheckIssue,
  SelfCheckResult,
} from './types';

const DEFAULT_OPTIONS: ConversionOptions = {
  slideWidth: 1920,
  slideHeight: 1080,
};

const DEFAULT_EXPECTATIONS: SelfCheckExpectations = {
  minSlides: 5,
  maxCriticalWarnings: 0,
  maxUnsupportedRules: 250,
  requireNonEmptyBlob: true,
  maxTotalTimeMs: 12000,
};

function mergeExpectations(
  expectations?: Partial<SelfCheckExpectations>,
): SelfCheckExpectations {
  return {
    ...DEFAULT_EXPECTATIONS,
    ...expectations,
  };
}

function normalizeOptions(
  options?: Partial<ConversionOptions>,
): { options: ConversionOptions; fix?: SelfCheckFix } {
  const merged = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const normalized: ConversionOptions = {
    slideWidth: Math.max(320, Math.round(merged.slideWidth)),
    slideHeight: Math.max(240, Math.round(merged.slideHeight)),
  };

  if (
    normalized.slideWidth !== merged.slideWidth ||
    normalized.slideHeight !== merged.slideHeight
  ) {
    return {
      options: normalized,
      fix: {
        strategy: 'normalize-options',
        description:
          'Adjusted invalid slide dimensions to safe minimum bounds.',
      },
    };
  }

  return { options: normalized };
}

function serializeDocument(doc: Document): string {
  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

function parseDocument(html: string): Document {
  const parser = new DOMParser();
  const wrappedHtml = html.includes('<html')
    ? html
    : `<html><body>${html}</body></html>`;
  return parser.parseFromString(wrappedHtml, 'text/html');
}

function sanitizeHtml(html: string): string {
  const doc = parseDocument(html);
  const removableSelectors = [
    'script',
    'noscript',
    'iframe',
    'object',
    'embed',
  ];

  for (const selector of removableSelectors) {
    const nodes = doc.querySelectorAll(selector);
    for (const node of nodes) {
      node.remove();
    }
  }

  return serializeDocument(doc);
}

function hasSlideMarkers(doc: Document): boolean {
  const body = doc.body;
  if (!body) {
    return false;
  }
  return (
    body.querySelector('[data-slide]') !== null ||
    body.querySelector('.slide') !== null
  );
}

function getTopLevelSections(parent: Element): Element[] {
  const sections: Element[] = [];
  for (const child of Array.from(parent.children)) {
    if (child.tagName.toLowerCase() === 'section') {
      sections.push(child);
    }
  }
  return sections;
}

function injectSlideMarkers(html: string): string {
  const doc = parseDocument(html);
  const body = doc.body;
  if (!body || hasSlideMarkers(doc)) {
    return serializeDocument(doc);
  }

  const topLevelSections = getTopLevelSections(body);
  if (topLevelSections.length > 0) {
    for (let i = 0; i < topLevelSections.length; i++) {
      const section = topLevelSections[i];
      section?.setAttribute('data-slide', String(i + 1));
    }
    return serializeDocument(doc);
  }

  const bodyChildren = Array.from(body.children);
  if (bodyChildren.length === 1) {
    const onlyChild = bodyChildren[0];
    if (onlyChild) {
      const nestedSections = getTopLevelSections(onlyChild);
      if (nestedSections.length > 0) {
        for (let i = 0; i < nestedSections.length; i++) {
          const section = nestedSections[i];
          section?.setAttribute('data-slide', String(i + 1));
        }
        return serializeDocument(doc);
      }
    }
  }

  for (let i = 0; i < bodyChildren.length; i++) {
    const child = bodyChildren[i];
    child?.setAttribute('data-slide', String(i + 1));
  }

  return serializeDocument(doc);
}

function evaluateSelfCheck(
  result: ConversionResult,
  expectations: SelfCheckExpectations,
): SelfCheckIssue[] {
  const issues: SelfCheckIssue[] = [];

  if (!result.report.success) {
    issues.push({
      code: 'SELF_CHECK_CONVERSION_FAILED',
      severity: 'critical',
      message: 'Conversion report marked the run as unsuccessful.',
      autoFixable: true,
    });
  }

  if (expectations.requireNonEmptyBlob && result.blob.size <= 0) {
    issues.push({
      code: 'SELF_CHECK_EMPTY_BLOB',
      severity: 'high',
      message: 'PPTX output blob is empty.',
      autoFixable: true,
    });
  }

  if (result.report.slideCount < expectations.minSlides) {
    issues.push({
      code: 'SELF_CHECK_SLIDE_COUNT',
      severity: 'high',
      message: `Slide count ${result.report.slideCount} is below expected minimum ${expectations.minSlides}.`,
      autoFixable: true,
    });
  }

  const criticalWarnings = result.report.warnings.filter(
    (warning) => warning.severity === 'critical',
  ).length;
  if (criticalWarnings > expectations.maxCriticalWarnings) {
    issues.push({
      code: 'SELF_CHECK_CRITICAL_WARNINGS',
      severity: 'high',
      message: `Critical warning count ${criticalWarnings} exceeded allowed ${expectations.maxCriticalWarnings}.`,
      autoFixable: false,
    });
  }

  if (result.report.unsupportedRules.length > expectations.maxUnsupportedRules) {
    issues.push({
      code: 'SELF_CHECK_UNSUPPORTED_RULES',
      severity: 'medium',
      message: `Unsupported rules ${result.report.unsupportedRules.length} exceeded allowed ${expectations.maxUnsupportedRules}.`,
      autoFixable: false,
    });
  }

  if (result.report.metrics.timeTotalMs > expectations.maxTotalTimeMs) {
    issues.push({
      code: 'SELF_CHECK_PERFORMANCE_BUDGET',
      severity: 'medium',
      message: `Total conversion time ${result.report.metrics.timeTotalMs}ms exceeded allowed ${expectations.maxTotalTimeMs}ms.`,
      autoFixable: false,
    });
  }

  return issues;
}

function hasBlockingIssues(issues: SelfCheckIssue[]): boolean {
  return issues.some(
    (issue) => issue.severity === 'critical' || issue.severity === 'high',
  );
}

function shouldAttemptSanitize(issues: SelfCheckIssue[]): boolean {
  return issues.some(
    (issue) =>
      issue.code === 'SELF_CHECK_CONVERSION_FAILED' ||
      issue.code === 'SELF_CHECK_EMPTY_BLOB',
  );
}

function shouldAttemptMarkerInjection(issues: SelfCheckIssue[]): boolean {
  return issues.some((issue) => issue.code === 'SELF_CHECK_SLIDE_COUNT');
}

export async function runSelfCheckWithAutoFix(
  html: string,
  assets: Map<string, Blob>,
  options?: Partial<ConversionOptions>,
  expectations?: Partial<SelfCheckExpectations>,
  onProgress?: (info: ProgressInfo) => void,
  signal?: AbortSignal,
): Promise<SelfCheckResult> {
  if (!html || html.trim().length === 0) {
    return {
      passed: false,
      issues: [
        {
          code: 'SELF_CHECK_EMPTY_INPUT',
          severity: 'high',
          message: 'Self-check fixture HTML is empty.',
          autoFixable: false,
        },
      ],
      fixesApplied: [],
      result: null,
    };
  }

  const fixesApplied: SelfCheckFix[] = [];
  const normalized = normalizeOptions(options);
  if (normalized.fix) {
    fixesApplied.push(normalized.fix);
  }

  const targetExpectations = mergeExpectations(expectations);
  let workingHtml = html;
  let result: ConversionResult | null = null;
  let issues: SelfCheckIssue[] = [];

  const attemptedStrategies = new Set<string>();

  for (let attempt = 0; attempt < 3; attempt++) {
    result = await convert(
      workingHtml,
      assets,
      normalized.options,
      onProgress,
      signal,
    );

    issues = evaluateSelfCheck(result, targetExpectations);
    if (!hasBlockingIssues(issues)) {
      return {
        passed: true,
        issues,
        fixesApplied,
        result,
      };
    }

    let appliedFix = false;

    if (
      shouldAttemptSanitize(issues) &&
      !attemptedStrategies.has('sanitize-html')
    ) {
      const sanitized = sanitizeHtml(workingHtml);
      if (sanitized !== workingHtml) {
        workingHtml = sanitized;
        fixesApplied.push({
          strategy: 'sanitize-html',
          description:
            'Removed unsafe/active tags and retried conversion.',
        });
        appliedFix = true;
      }
      attemptedStrategies.add('sanitize-html');
    }

    if (
      !appliedFix &&
      shouldAttemptMarkerInjection(issues) &&
      !attemptedStrategies.has('inject-slide-markers')
    ) {
      const withMarkers = injectSlideMarkers(workingHtml);
      if (withMarkers !== workingHtml) {
        workingHtml = withMarkers;
        fixesApplied.push({
          strategy: 'inject-slide-markers',
          description:
            'Injected data-slide markers for top-level blocks and retried conversion.',
        });
        appliedFix = true;
      }
      attemptedStrategies.add('inject-slide-markers');
    }

    if (!appliedFix) {
      break;
    }
  }

  return {
    passed: false,
    issues,
    fixesApplied,
    result,
  };
}

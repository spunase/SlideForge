/**
 * XML utility helpers for OOXML generation.
 */

/**
 * Escape special XML characters in a string.
 * Handles the five predefined XML entities.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Returns the standard XML declaration for OOXML parts.
 */
export function xmlDeclaration(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
}

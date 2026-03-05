/**
 * Build stage — converts MappedShapes into SlideShapes ready for XML generation.
 *
 * Bridges the gap between the style mapper output (MappedShape) and
 * the builder input (SlideShape) by converting all measurements to EMU
 * and mapping style types to their OOXML equivalents.
 */

import type { MappedShape, FillStyle, BorderStyle, ShadowStyle, TextStyle } from '../../types';
import type {
  SlideShape,
  TextRun,
  ShapeFill,
  ShapeBorder,
  ShapeShadow,
} from '../../builders';
import type { SlideData } from '../../assembler';
import { pxToEmu } from '../../utils/emu';
import { mapFont } from '../../styles';

export interface BuildResult {
  slides: SlideData[];
  fontSubstitutions: Array<{ original: string; replacement: string }>;
}

/**
 * Convert a FillStyle to a ShapeFill for the builder.
 */
function convertFill(fill: FillStyle): ShapeFill {
  switch (fill.type) {
    case 'solid':
      return {
        type: 'solid',
        color: fill.color ?? '000000',
        alpha: fill.alpha,
      };
    case 'gradient':
      return {
        type: 'gradient',
        angle: fill.gradientAngle ?? 0,
        stops: (fill.gradientStops ?? []).map((stop) => ({
          // OOXML gradient stops use 0–100000 scale
          position: stop.position * 1000,
          color: stop.color,
        })),
      };
    case 'none':
      return { type: 'none' };
  }
}

/**
 * Convert a BorderStyle to a ShapeBorder for the builder.
 */
function convertBorder(border: BorderStyle): ShapeBorder | undefined {
  if (border.style === 'none' || border.width === 0) {
    // Still pass through border-radius even without a visible stroke
    if (border.radius !== undefined && border.radius > 0) {
      return {
        width: 0,
        color: '000000',
        radius: pxToEmu(border.radius),
      };
    }
    return undefined;
  }

  let dashStyle: string | undefined;
  switch (border.style) {
    case 'dashed':
      dashStyle = 'dash';
      break;
    case 'dotted':
      dashStyle = 'dot';
      break;
    case 'solid':
      dashStyle = undefined;
      break;
  }

  return {
    width: pxToEmu(border.width),
    color: border.color,
    dashStyle,
    radius: border.radius !== undefined ? pxToEmu(border.radius) : undefined,
  };
}

/**
 * Convert a ShadowStyle to a ShapeShadow for the builder.
 */
function convertShadow(shadow: ShadowStyle | null): ShapeShadow | undefined {
  if (!shadow) {
    return undefined;
  }

  // Calculate distance and direction from offsetX/offsetY
  const dist = pxToEmu(Math.sqrt(shadow.offsetX ** 2 + shadow.offsetY ** 2));
  // Direction in 60000ths of a degree
  const angleRad = Math.atan2(shadow.offsetY, shadow.offsetX);
  const angleDeg = (angleRad * 180) / Math.PI;
  // OOXML direction: 0 = right, 90 = down (same as atan2 convention)
  const dir = Math.round(((angleDeg + 360) % 360) * 60000);

  return {
    blurRad: pxToEmu(shadow.blur),
    dist,
    dir,
    color: shadow.color,
    alpha: shadow.alpha,
  };
}

/**
 * Convert a TextStyle + text content into TextRun(s) for the builder.
 */
function convertTextRuns(
  textStyle: TextStyle,
  textContent: string | null,
  fontSubstitutions: Array<{ original: string; replacement: string }>,
): TextRun[] {
  if (!textContent || textContent.trim().length === 0) {
    return [];
  }

  // Map font family
  const fontResult = mapFont(textStyle.fontFamily);
  if (fontResult.substitution) {
    // Only add if not already recorded
    const alreadyRecorded = fontSubstitutions.some(
      (s) =>
        s.original === fontResult.substitution!.original &&
        s.replacement === fontResult.substitution!.replacement,
    );
    if (!alreadyRecorded) {
      fontSubstitutions.push(fontResult.substitution);
    }
  }

  // Convert px font size to points (1px = 0.75pt at 96 DPI)
  const fontSizePt = textStyle.fontSize * 0.75;

  // Apply text-transform
  let text = textContent.trim();
  switch (textStyle.textTransform) {
    case 'uppercase':
      text = text.toUpperCase();
      break;
    case 'lowercase':
      text = text.toLowerCase();
      break;
    case 'capitalize':
      text = text.replace(/\b\w/g, (c) => c.toUpperCase());
      break;
  }

  return [
    {
      text,
      fontFamily: fontResult.mapped,
      fontSize: fontSizePt,
      fontWeight: textStyle.fontWeight,
      fontStyle: textStyle.fontStyle,
      color: textStyle.color,
      underline: textStyle.textDecoration === 'underline',
    },
  ];
}

/**
 * Build SlideData arrays from MappedShape arrays.
 *
 * @param mappedSlides - Arrays of MappedShape per slide
 * @returns SlideData arrays ready for the assembler and font substitution records
 */
export function build(mappedSlides: MappedShape[][]): BuildResult {
  const fontSubstitutions: Array<{ original: string; replacement: string }> = [];
  const slides: SlideData[] = [];

  for (const shapes of mappedSlides) {
    const slideShapes: SlideShape[] = [];
    let shapeId = 2; // Start at 2 (1 is reserved for the group shape)

    for (const shape of shapes) {
      // Determine shape type.
      // Image embedding (relationship wiring + media package writes) is Phase 2.
      // For now, keep image geometry as a rect placeholder to avoid hard failures.
      let shapeType: 'text' | 'image' | 'rect' = 'rect';
      if (shape.textContent && shape.textContent.trim().length > 0) {
        shapeType = 'text';
      }

      // Convert geometry to EMU
      const x = pxToEmu(shape.geometry.x);
      const y = pxToEmu(shape.geometry.y);
      const width = pxToEmu(shape.geometry.width);
      const height = pxToEmu(shape.geometry.height);

      // Build text runs if applicable
      let textRuns: TextRun[] | undefined;
      if (shape.textStyle && shape.textContent) {
        textRuns = convertTextRuns(shape.textStyle, shape.textContent, fontSubstitutions);
        if (textRuns.length === 0) {
          textRuns = undefined;
        }
      }

      const slideShape: SlideShape = {
        id: shapeId++,
        name: `Shape ${shapeId - 1}`,
        type: shapeType,
        x,
        y,
        width,
        height,
        fill: convertFill(shape.fill),
        border: convertBorder(shape.border),
        shadow: convertShadow(shape.shadow),
        textRuns,
        textAlign: shape.textStyle?.textAlign,
      };

      slideShapes.push(slideShape);
    }

    slides.push({
      shapes: slideShapes,
      images: [], // Image embedding is handled in Phase 2
    });
  }

  return { slides, fontSubstitutions };
}

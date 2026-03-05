/**
 * Core style types used across the SlideForge project.
 * These types represent the intermediate representation between
 * CSS computed styles and OOXML DrawingML attributes.
 */

export interface FillStyle {
  type: 'solid' | 'gradient' | 'none';
  color?: string;            // RRGGBB hex
  alpha?: number;            // 0-1
  gradientAngle?: number;    // degrees
  gradientStops?: GradientStop[];
}

export interface GradientStop {
  position: number;          // 0-100
  color: string;             // RRGGBB hex
}

export interface BorderStyle {
  width: number;             // pixels
  color: string;             // RRGGBB hex
  style: 'solid' | 'dashed' | 'dotted' | 'none';
  radius?: number;           // pixels (border-radius)
}

export interface ShadowStyle {
  offsetX: number;           // pixels
  offsetY: number;           // pixels
  blur: number;              // pixels
  spread: number;            // pixels (ignored in PPTX, recorded for warning)
  color: string;             // RRGGBB hex
  alpha: number;             // 0-1
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;          // pixels
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;        // ratio (1.5 = 150%)
  letterSpacing: number;     // pixels
  color: string;             // RRGGBB hex
  alpha: number;             // 0-1
}

export interface ElementGeometry {
  x: number;                 // pixels from slide left
  y: number;                 // pixels from slide top
  width: number;             // pixels
  height: number;            // pixels
  zIndex: number;
}

export type SupportTier = 'A' | 'B' | 'C';

export interface ConversionWarning {
  code: string;              // e.g. SF-CSS-001
  severity: 'low' | 'medium' | 'high' | 'critical';
  property: string;
  message: string;
  original?: string;
}

export interface MappedShape {
  geometry: ElementGeometry;
  fill: FillStyle;
  border: BorderStyle;
  shadow: ShadowStyle | null;
  textStyle: TextStyle | null;
  textContent: string | null;
  imageUrl: string | null;
  warnings: ConversionWarning[];
}

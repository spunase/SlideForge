import type React from 'react';
import type { MappedShape, FillStyle, BorderStyle, ShadowStyle, TextStyle } from '@core/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SlidePreviewRendererProps {
  shapes: MappedShape[];
  slideWidth: number;
  slideHeight: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helper functions (private)
// ---------------------------------------------------------------------------

function buildFillStyle(fill: FillStyle): React.CSSProperties {
  switch (fill.type) {
    case 'solid':
      return {
        backgroundColor: `#${fill.color}`,
        opacity: fill.alpha,
      };
    case 'gradient': {
      const stops = (fill.gradientStops ?? [])
        .map((stop) => `#${stop.color} ${stop.position}%`)
        .join(', ');
      return {
        background: `linear-gradient(${fill.gradientAngle ?? 0}deg, ${stops})`,
      };
    }
    case 'none':
    default:
      return {};
  }
}

function buildBorderStyle(border: BorderStyle): React.CSSProperties {
  if (border.style === 'none' || border.width === 0) {
    return {};
  }

  return {
    borderWidth: border.width,
    borderColor: `#${border.color}`,
    borderStyle: border.style,
    borderRadius: border.radius,
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace(/^#/, '');
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function buildShadowStyle(shadow: ShadowStyle | null): React.CSSProperties {
  if (!shadow) {
    return {};
  }

  const { r, g, b } = hexToRgb(shadow.color);

  return {
    boxShadow: `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px rgba(${r},${g},${b},${shadow.alpha})`,
  };
}

function buildTextStyle(textStyle: TextStyle | null): React.CSSProperties {
  if (!textStyle) {
    return {};
  }

  return {
    fontFamily: textStyle.fontFamily,
    fontSize: `${textStyle.fontSize}px`,
    fontWeight: textStyle.fontWeight === 'bold' ? 700 : 400,
    fontStyle: textStyle.fontStyle,
    textDecoration: textStyle.textDecoration,
    textAlign: textStyle.textAlign,
    lineHeight: textStyle.lineHeight,
    letterSpacing: `${textStyle.letterSpacing}px`,
    color: `#${textStyle.color}`,
  };
}

// ---------------------------------------------------------------------------
// ShapeElement (private sub-component)
// ---------------------------------------------------------------------------

interface ShapeElementProps {
  shape: MappedShape;
  slideWidth: number;
  slideHeight: number;
}

function ShapeElement({ shape, slideWidth, slideHeight }: ShapeElementProps) {
  const { geometry, fill, border, shadow, textStyle, textContent, imageUrl } = shape;

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${(geometry.x / slideWidth) * 100}%`,
    top: `${(geometry.y / slideHeight) * 100}%`,
    width: `${(geometry.width / slideWidth) * 100}%`,
    height: `${(geometry.height / slideHeight) * 100}%`,
    zIndex: geometry.zIndex,
    overflow: 'hidden',
  };

  const combinedStyle: React.CSSProperties = {
    ...positionStyle,
    ...buildFillStyle(fill),
    ...buildBorderStyle(border),
    ...buildShadowStyle(shadow),
  };

  return (
    <div style={combinedStyle}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : textContent ? (
        <span style={buildTextStyle(textStyle)}>{textContent}</span>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SlidePreviewRenderer (exported)
// ---------------------------------------------------------------------------

export function SlidePreviewRenderer({
  shapes,
  slideWidth,
  slideHeight,
  className,
}: SlidePreviewRendererProps) {
  return (
    <div
      className={`bg-white rounded overflow-hidden ${className ?? ''}`}
      style={{
        position: 'relative',
        aspectRatio: `${slideWidth} / ${slideHeight}`,
      }}
      role="img"
      aria-label="Slide preview"
    >
      {shapes.map((shape, index) => (
        <ShapeElement
          key={index}
          shape={shape}
          slideWidth={slideWidth}
          slideHeight={slideHeight}
        />
      ))}
    </div>
  );
}

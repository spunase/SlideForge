/**
 * Barrel exports for all OOXML builders.
 */

export { buildContentTypes } from './ContentTypesBuilder.js';

export {
  buildRootRels,
  buildPresentationRels,
  buildSlideRels,
} from './RelsBuilder.js';

export { buildPresentation } from './PresentationBuilder.js';

export {
  buildSlideXml,
} from './SlideBuilder.js';

export type {
  TextRun,
  SlideShape,
  SolidFill,
  GradientFill,
  GradientStop,
  NoneFill,
  ShapeFill,
  ShapeBorder,
  ShapeShadow,
} from './SlideBuilder.js';

export {
  buildTheme,
  buildSlideMaster,
  buildSlideLayout,
  buildSlideMasterRels,
  buildSlideLayoutRels,
} from './StylesBuilder.js';

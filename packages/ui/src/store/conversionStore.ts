import { create } from 'zustand';
import type { MappedShape } from '@core/types';

interface ConversionError {
  code: string;
  message: string;
}

interface SlidePreview {
  preview: string;
  index: number;
}

interface SlideSize {
  width: number;
  height: number;
}

export interface ConversionStore {
  files: Map<string, Blob>;
  slides: Array<SlidePreview>;
  mappedSlides: MappedShape[][];
  selectedSlideIndex: number | null;
  status: 'idle' | 'parsing' | 'converting' | 'done' | 'error';
  progress: number;
  currentStage: string | null;
  downloadUrl: string | null;
  outputSizeBytes: number | null;
  error: ConversionError | null;
  slideSize: SlideSize;
  sourceHtml: string | null;
  comparisonMode: boolean;

  setFiles: (files: Map<string, Blob>) => void;
  addSlidePreview: (preview: string, index: number) => void;
  setMappedSlides: (slides: MappedShape[][]) => void;
  setSelectedSlideIndex: (index: number | null) => void;
  setStatus: (status: ConversionStore['status']) => void;
  setProgress: (progress: number) => void;
  setStage: (stage: string | null) => void;
  setDownloadUrl: (url: string | null) => void;
  setOutputSizeBytes: (sizeBytes: number | null) => void;
  setError: (error: ConversionError | null) => void;
  setSlideSize: (size: SlideSize) => void;
  setSourceHtml: (html: string | null) => void;
  setComparisonMode: (enabled: boolean) => void;
  reset: () => void;
}

const initialState = {
  files: new Map<string, Blob>(),
  slides: [] as Array<SlidePreview>,
  mappedSlides: [] as MappedShape[][],
  selectedSlideIndex: null as number | null,
  status: 'idle' as const,
  progress: 0,
  currentStage: null as string | null,
  downloadUrl: null as string | null,
  outputSizeBytes: null as number | null,
  error: null as ConversionError | null,
  slideSize: { width: 1920, height: 1080 },
  sourceHtml: null as string | null,
  comparisonMode: false,
};

export const useConversionStore = create<ConversionStore>((set) => ({
  ...initialState,

  setFiles: (files) => set({ files }),

  addSlidePreview: (preview, index) =>
    set((state) => ({
      slides: [...state.slides, { preview, index }].sort(
        (a, b) => a.index - b.index,
      ),
    })),

  setMappedSlides: (slides) => set({ mappedSlides: slides }),

  setSelectedSlideIndex: (index) => set({ selectedSlideIndex: index }),

  setStatus: (status) => set({ status }),

  setProgress: (progress) => set({ progress: Math.min(100, Math.max(0, progress)) }),

  setStage: (stage) => set({ currentStage: stage }),

  setDownloadUrl: (url) => set({ downloadUrl: url }),

  setOutputSizeBytes: (sizeBytes) => set({ outputSizeBytes: sizeBytes }),

  setError: (error) => set({ error }),

  setSlideSize: (size) => set({ slideSize: size }),

  setSourceHtml: (html) => set({ sourceHtml: html }),

  setComparisonMode: (enabled) => set({ comparisonMode: enabled }),

  reset: () =>
    set({
      ...initialState,
      files: new Map<string, Blob>(),
      slides: [],
      mappedSlides: [],
      selectedSlideIndex: null,
      sourceHtml: null,
      comparisonMode: false,
    }),
}));

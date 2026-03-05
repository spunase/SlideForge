import { create } from 'zustand';

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
  status: 'idle' | 'parsing' | 'converting' | 'done' | 'error';
  progress: number;
  currentStage: string | null;
  downloadUrl: string | null;
  error: ConversionError | null;
  slideSize: SlideSize;

  setFiles: (files: Map<string, Blob>) => void;
  addSlidePreview: (preview: string, index: number) => void;
  setStatus: (status: ConversionStore['status']) => void;
  setProgress: (progress: number) => void;
  setStage: (stage: string | null) => void;
  setDownloadUrl: (url: string | null) => void;
  setError: (error: ConversionError | null) => void;
  setSlideSize: (size: SlideSize) => void;
  reset: () => void;
}

const initialState = {
  files: new Map<string, Blob>(),
  slides: [] as Array<SlidePreview>,
  status: 'idle' as const,
  progress: 0,
  currentStage: null as string | null,
  downloadUrl: null as string | null,
  error: null as ConversionError | null,
  slideSize: { width: 1920, height: 1080 },
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

  setStatus: (status) => set({ status }),

  setProgress: (progress) => set({ progress: Math.min(100, Math.max(0, progress)) }),

  setStage: (stage) => set({ currentStage: stage }),

  setDownloadUrl: (url) => set({ downloadUrl: url }),

  setError: (error) => set({ error }),

  setSlideSize: (size) => set({ slideSize: size }),

  reset: () =>
    set({
      ...initialState,
      files: new Map<string, Blob>(),
      slides: [],
    }),
}));

import { useConversionStore } from './conversionStore';

// Reset the store before each test
beforeEach(() => {
  useConversionStore.getState().reset();
});

describe('conversionStore', () => {
  describe('initial state', () => {
    it('should start with idle status', () => {
      const state = useConversionStore.getState();
      expect(state.status).toBe('idle');
    });

    it('should start with empty files map', () => {
      const state = useConversionStore.getState();
      expect(state.files.size).toBe(0);
    });

    it('should start with empty slides array', () => {
      const state = useConversionStore.getState();
      expect(state.slides).toHaveLength(0);
    });

    it('should start with progress at 0', () => {
      const state = useConversionStore.getState();
      expect(state.progress).toBe(0);
    });

    it('should start with null currentStage', () => {
      const state = useConversionStore.getState();
      expect(state.currentStage).toBeNull();
    });

    it('should start with null downloadUrl', () => {
      const state = useConversionStore.getState();
      expect(state.downloadUrl).toBeNull();
    });

    it('should start with null outputSizeBytes', () => {
      const state = useConversionStore.getState();
      expect(state.outputSizeBytes).toBeNull();
    });

    it('should start with null error', () => {
      const state = useConversionStore.getState();
      expect(state.error).toBeNull();
    });

    it('should start with default slide size 1920x1080', () => {
      const state = useConversionStore.getState();
      expect(state.slideSize).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe('setFiles', () => {
    it('should set the files map', () => {
      const files = new Map<string, Blob>();
      files.set('test.html', new Blob(['<h1>Test</h1>']));

      useConversionStore.getState().setFiles(files);

      expect(useConversionStore.getState().files.size).toBe(1);
      expect(useConversionStore.getState().files.has('test.html')).toBe(true);
    });
  });

  describe('addSlidePreview', () => {
    it('should add a slide preview', () => {
      useConversionStore.getState().addSlidePreview('data:image/png;base64,abc', 0);

      const state = useConversionStore.getState();
      expect(state.slides).toHaveLength(1);
      expect(state.slides[0]!.preview).toBe('data:image/png;base64,abc');
      expect(state.slides[0]!.index).toBe(0);
    });

    it('should sort slides by index', () => {
      const store = useConversionStore.getState();
      store.addSlidePreview('slide2', 2);
      store.addSlidePreview('slide0', 0);
      store.addSlidePreview('slide1', 1);

      const state = useConversionStore.getState();
      expect(state.slides[0]!.index).toBe(0);
      expect(state.slides[1]!.index).toBe(1);
      expect(state.slides[2]!.index).toBe(2);
    });
  });

  describe('setStatus', () => {
    it('should set status to "converting"', () => {
      useConversionStore.getState().setStatus('converting');
      expect(useConversionStore.getState().status).toBe('converting');
    });

    it('should set status to "done"', () => {
      useConversionStore.getState().setStatus('done');
      expect(useConversionStore.getState().status).toBe('done');
    });

    it('should set status to "error"', () => {
      useConversionStore.getState().setStatus('error');
      expect(useConversionStore.getState().status).toBe('error');
    });
  });

  describe('setProgress', () => {
    it('should set progress value', () => {
      useConversionStore.getState().setProgress(50);
      expect(useConversionStore.getState().progress).toBe(50);
    });

    it('should clamp progress to 100 max', () => {
      useConversionStore.getState().setProgress(150);
      expect(useConversionStore.getState().progress).toBe(100);
    });

    it('should clamp progress to 0 min', () => {
      useConversionStore.getState().setProgress(-10);
      expect(useConversionStore.getState().progress).toBe(0);
    });
  });

  describe('setStage', () => {
    it('should set current stage', () => {
      useConversionStore.getState().setStage('render');
      expect(useConversionStore.getState().currentStage).toBe('render');
    });

    it('should set stage to null', () => {
      useConversionStore.getState().setStage('render');
      useConversionStore.getState().setStage(null);
      expect(useConversionStore.getState().currentStage).toBeNull();
    });
  });

  describe('setDownloadUrl', () => {
    it('should set download URL', () => {
      useConversionStore.getState().setDownloadUrl('blob:http://localhost/abc');
      expect(useConversionStore.getState().downloadUrl).toBe('blob:http://localhost/abc');
    });

    it('should set download URL to null', () => {
      useConversionStore.getState().setDownloadUrl('blob:test');
      useConversionStore.getState().setDownloadUrl(null);
      expect(useConversionStore.getState().downloadUrl).toBeNull();
    });
  });

  describe('setOutputSizeBytes', () => {
    it('should set output size in bytes', () => {
      useConversionStore.getState().setOutputSizeBytes(1048576);
      expect(useConversionStore.getState().outputSizeBytes).toBe(1048576);
    });

    it('should clear output size with null', () => {
      useConversionStore.getState().setOutputSizeBytes(2560);
      useConversionStore.getState().setOutputSizeBytes(null);
      expect(useConversionStore.getState().outputSizeBytes).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error', () => {
      useConversionStore.getState().setError({ code: 'E001', message: 'Something went wrong' });
      const state = useConversionStore.getState();
      expect(state.error).toEqual({ code: 'E001', message: 'Something went wrong' });
    });

    it('should clear error with null', () => {
      useConversionStore.getState().setError({ code: 'E001', message: 'Error' });
      useConversionStore.getState().setError(null);
      expect(useConversionStore.getState().error).toBeNull();
    });
  });

  describe('setSlideSize', () => {
    it('should set custom slide size', () => {
      useConversionStore.getState().setSlideSize({ width: 1280, height: 720 });
      expect(useConversionStore.getState().slideSize).toEqual({ width: 1280, height: 720 });
    });
  });

  describe('setSourceHtml', () => {
    it('should store the original HTML string', () => {
      useConversionStore.getState().setSourceHtml('<h1>Hello</h1>');
      expect(useConversionStore.getState().sourceHtml).toBe('<h1>Hello</h1>');
    });

    it('should clear with null', () => {
      useConversionStore.getState().setSourceHtml('<p>test</p>');
      useConversionStore.getState().setSourceHtml(null);
      expect(useConversionStore.getState().sourceHtml).toBeNull();
    });
  });

  describe('setComparisonMode', () => {
    it('should start as false', () => {
      expect(useConversionStore.getState().comparisonMode).toBe(false);
    });

    it('should toggle comparison mode on', () => {
      useConversionStore.getState().setComparisonMode(true);
      expect(useConversionStore.getState().comparisonMode).toBe(true);
    });

    it('should toggle comparison mode off', () => {
      useConversionStore.getState().setComparisonMode(true);
      useConversionStore.getState().setComparisonMode(false);
      expect(useConversionStore.getState().comparisonMode).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = useConversionStore.getState();
      store.setStatus('converting');
      store.setProgress(75);
      store.setStage('build');
      store.setDownloadUrl('blob:test');
      store.setOutputSizeBytes(5000);
      store.setError({ code: 'E001', message: 'Error' });
      store.setSlideSize({ width: 1280, height: 720 });
      store.setSourceHtml('<h1>Test</h1>');
      store.setComparisonMode(true);

      store.reset();

      const state = useConversionStore.getState();
      expect(state.status).toBe('idle');
      expect(state.progress).toBe(0);
      expect(state.currentStage).toBeNull();
      expect(state.downloadUrl).toBeNull();
      expect(state.outputSizeBytes).toBeNull();
      expect(state.error).toBeNull();
      expect(state.slideSize).toEqual({ width: 1920, height: 1080 });
      expect(state.files.size).toBe(0);
      expect(state.slides).toHaveLength(0);
      expect(state.sourceHtml).toBeNull();
      expect(state.comparisonMode).toBe(false);
    });
  });
});

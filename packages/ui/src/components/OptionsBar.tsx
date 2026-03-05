import { useCallback, useState } from 'react';
import { useConversionStore } from '../store';

interface SizePreset {
  label: string;
  width: number;
  height: number;
}

const SIZE_PRESETS: Array<SizePreset> = [
  { label: '16:9 (1920\u00D71080)', width: 1920, height: 1080 },
  { label: '4:3 (1440\u00D71080)', width: 1440, height: 1080 },
  { label: 'A4 (794\u00D71123)', width: 794, height: 1123 },
];

export function OptionsBar({ onGenerate }: { onGenerate: () => void }) {
  const files = useConversionStore((s) => s.files);
  const slideSize = useConversionStore((s) => s.slideSize);
  const setSlideSize = useConversionStore((s) => s.setSlideSize);
  const status = useConversionStore((s) => s.status);

  const [isCustom, setIsCustom] = useState(false);

  const hasFiles = files.size > 0;
  const isConverting = status === 'parsing' || status === 'converting';

  const handlePresetChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === 'custom') {
        setIsCustom(true);
        return;
      }
      setIsCustom(false);
      const preset = SIZE_PRESETS[Number(value)];
      if (preset) {
        setSlideSize({ width: preset.width, height: preset.height });
      }
    },
    [setSlideSize],
  );

  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const width = Math.max(1, Number(e.target.value) || 0);
      setSlideSize({ width, height: slideSize.height });
    },
    [setSlideSize, slideSize.height],
  );

  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const height = Math.max(1, Number(e.target.value) || 0);
      setSlideSize({ width: slideSize.width, height });
    },
    [setSlideSize, slideSize.width],
  );

  const currentPresetIndex = SIZE_PRESETS.findIndex(
    (p) => p.width === slideSize.width && p.height === slideSize.height,
  );
  const selectValue = isCustom ? 'custom' : currentPresetIndex >= 0 ? String(currentPresetIndex) : 'custom';

  const controlClass = `
    h-9 rounded-lg border border-[var(--sf-control-border)] bg-[var(--sf-control-bg)] px-3
    text-sm text-[var(--sf-text)]
    transition-all duration-150
    hover:border-[var(--sf-control-border-hover)] hover:bg-[var(--sf-control-bg-hover)] hover:ring-1 hover:ring-[var(--sf-accent)]/20
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-panel-elevated)]
  `;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between rounded-xl bg-[var(--sf-panel-elevated)] border border-[var(--sf-border)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="slide-size-preset"
            className="text-xs font-medium text-[var(--sf-text-muted)] uppercase tracking-wider"
          >
            Slide Size
          </label>
          <select
            id="slide-size-preset"
            value={selectValue}
            onChange={handlePresetChange}
            className={`${controlClass} appearance-none cursor-pointer`}
          >
            {SIZE_PRESETS.map((preset, i) => (
              <option key={i} value={String(i)}>
                {preset.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>

        {(isCustom || (currentPresetIndex < 0 && !isCustom)) && (
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="custom-width"
                className="text-xs font-medium text-[var(--sf-text-muted)] uppercase tracking-wider"
              >
                Width (px)
              </label>
              <input
                id="custom-width"
                type="number"
                min={1}
                value={slideSize.width}
                onChange={handleWidthChange}
                className={`${controlClass} w-24 font-mono`}
              />
            </div>
            <span className="pb-1.5 text-sm text-[var(--sf-text-muted)]" aria-hidden="true">&times;</span>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="custom-height"
                className="text-xs font-medium text-[var(--sf-text-muted)] uppercase tracking-wider"
              >
                Height (px)
              </label>
              <input
                id="custom-height"
                type="number"
                min={1}
                value={slideSize.height}
                onChange={handleHeightChange}
                className={`${controlClass} w-24 font-mono`}
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={!hasFiles || isConverting}
        className="
          h-10 rounded-lg px-6 cursor-pointer
          text-sm font-semibold
          transition-all duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-panel-elevated)]
          disabled:cursor-not-allowed disabled:opacity-40
          bg-[var(--sf-accent)] text-[var(--sf-bg-0)]
          hover:bg-[var(--sf-accent-hover)] hover:shadow-lg hover:shadow-[var(--sf-accent)]/10 hover:scale-[1.02]
          active:bg-[var(--sf-accent-active)]
        "
        aria-label={isConverting ? 'Conversion in progress' : 'Generate PowerPoint presentation'}
      >
        {isConverting ? 'Converting...' : 'Generate PPTX'}
      </button>
    </div>
  );
}

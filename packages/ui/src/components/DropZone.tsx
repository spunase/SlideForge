import { useCallback, useRef, useState } from 'react';
import { useConversionStore } from '../store';

const ACCEPTED_EXTENSIONS = ['.html', '.htm', '.zip'];
const ACCEPTED_MIME_TYPES = [
  'text/html',
  'application/zip',
  'application/x-zip-compressed',
];

function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : '';
}

function isValidFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  if (ACCEPTED_EXTENSIONS.includes(ext)) return true;
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  return false;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DropZone() {
  const setFiles = useConversionStore((s) => s.setFiles);
  const setError = useConversionStore((s) => s.setError);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [droppedFile, setDroppedFile] = useState<{ name: string; size: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!isValidFile(file)) {
        setValidationError('Unsupported file type. Upload .html or .zip');
        setDroppedFile(null);
        return;
      }

      setValidationError(null);
      setDroppedFile({ name: file.name, size: file.size });

      const fileMap = new Map<string, Blob>();
      fileMap.set(file.name, file);
      setFiles(fileMap);
      setError(null);
    },
    [setFiles, setError],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      const first = droppedFiles[0];
      if (droppedFiles.length > 0 && first) {
        handleFile(first);
      }
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      const first = selectedFiles?.[0];
      if (first) {
        handleFile(first);
      }
    },
    [handleFile],
  );

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFilePicker();
      }
    },
    [openFilePicker],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload HTML file"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFilePicker}
      onKeyDown={handleKeyDown}
      className={`
        group relative flex flex-col items-center justify-center
        w-full flex-1 min-h-[120px] rounded-xl p-6
        transition-all duration-200 ease-out cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B714] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D]
        ${
          isDragOver
            ? 'border-2 border-[#E2B714] bg-[#E2B714]/5'
            : droppedFile && !validationError
              ? 'border-2 border-[#333333] bg-[#1A1A1A]'
              : 'border-2 border-dashed border-[#555555] bg-[#111111] hover:border-[#777777] hover:bg-[#151515] hover:scale-[1.01] hover:shadow-lg hover:shadow-[#E2B714]/5'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".html,.htm,.zip"
        onChange={handleInputChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      {validationError ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4D4D]/10">
            <svg
              className="h-5 w-5 text-[#FF6B6B]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm text-[#FF6B6B]" role="alert">
            {validationError}
          </p>
          <p className="text-xs text-[#999999]">Click or drop a valid file to try again</p>
        </div>
      ) : droppedFile ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#23C16B]/10">
            <svg
              className="h-5 w-5 text-[#2DD881]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{droppedFile.name}</p>
            <p className="text-xs text-[#999999]">{formatFileSize(droppedFile.size)}</p>
          </div>
          <p className="text-xs text-[#999999]">Click or drop another file to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A1A]">
            <svg
              className="h-5 w-5 text-[#999999] transition-transform duration-200 group-hover:-translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              Drop your HTML file here
            </p>
            <p className="text-xs text-[#999999] mt-0.5">
              or click to browse — accepts .html, .htm, .zip
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

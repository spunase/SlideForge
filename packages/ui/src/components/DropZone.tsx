import { useCallback, useRef, useState } from 'react';
import { useConversionStore } from '../store';

const PRIMARY_EXTENSIONS = ['.html', '.htm', '.zip'];
const ASSET_EXTENSIONS = [
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.webp',
  '.gif',
  '.ttf',
  '.otf',
  '.woff',
  '.woff2',
  '.js',
];
const ACCEPTED_MIME_TYPES = [
  'text/html',
  'text/css',
  'application/javascript',
  'application/zip',
  'application/x-zip-compressed',
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
  'image/gif',
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
];

type DragIntent = 'neutral' | 'ready' | 'invalid';

function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : '';
}

function isPrimaryFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  if (PRIMARY_EXTENSIONS.includes(ext)) return true;
  if (file.type === 'text/html') return true;
  if (
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed'
  ) {
    return true;
  }
  return false;
}

function isValidFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  if (PRIMARY_EXTENSIONS.includes(ext)) return true;
  if (ASSET_EXTENSIONS.includes(ext)) return true;
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  return false;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getUploadKey(file: File): string {
  if (
    typeof file.webkitRelativePath === 'string' &&
    file.webkitRelativePath.length > 0
  ) {
    return file.webkitRelativePath;
  }
  return file.name;
}

function formatSelectionLabel(count: number, firstName: string): string {
  if (count === 1) {
    return firstName;
  }
  return `${count} files selected`;
}

function evaluateDragIntent(items: DataTransferItemList): DragIntent {
  const dataItems = Array.from(items).filter((item) => item.kind === 'file');
  if (dataItems.length === 0) {
    return 'invalid';
  }

  let hasPrimary = false;
  let hasKnownValid = false;
  let hasUnknown = false;

  for (const item of dataItems) {
    const type = item.type.toLowerCase();

    if (type === 'text/html' || type === 'application/zip' || type === 'application/x-zip-compressed') {
      hasPrimary = true;
      break;
    }

    if (type.length === 0) {
      hasUnknown = true;
      continue;
    }

    if (ACCEPTED_MIME_TYPES.includes(type)) {
      hasKnownValid = true;
    }
  }

  if (hasPrimary || hasUnknown) {
    return 'ready';
  }

  if (hasKnownValid) {
    return 'invalid';
  }

  return 'invalid';
}

export function DropZone() {
  const setFiles = useConversionStore((s) => s.setFiles);
  const setError = useConversionStore((s) => s.setError);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIntent, setDragIntent] = useState<DragIntent>('neutral');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [droppedFile, setDroppedFile] = useState<{
    name: string;
    size: number;
    count: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) {
        setValidationError('No files were provided.');
        setDroppedFile(null);
        return;
      }

      const validFiles = files.filter(isValidFile);
      if (validFiles.length === 0) {
        setValidationError('Unsupported file type. Upload HTML with related assets.');
        setDroppedFile(null);
        return;
      }

      if (!validFiles.some(isPrimaryFile)) {
        setValidationError('Upload at least one .html/.htm file or a .zip bundle.');
        setDroppedFile(null);
        return;
      }

      const fileMap = new Map<string, Blob>();
      let totalSize = 0;

      for (const file of validFiles) {
        fileMap.set(getUploadKey(file), file);
        totalSize += file.size;
      }

      setValidationError(null);
      setDroppedFile({
        name: formatSelectionLabel(validFiles.length, validFiles[0]?.name ?? 'files'),
        size: totalSize,
        count: validFiles.length,
      });
      setFiles(fileMap);
      setError(null);
    },
    [setFiles, setError],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragOver(true);
    setDragIntent(evaluateDragIntent(e.dataTransfer.items));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
    setDragIntent(evaluateDragIntent(e.dataTransfer.items));
  }, [isDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragOver(false);
      setDragIntent('neutral');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setIsDragOver(false);
      setDragIntent('neutral');

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    },
    [handleFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        handleFiles(selectedFiles);
      }
    },
    [handleFiles],
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

  const dragClass = isDragOver
    ? dragIntent === 'invalid'
      ? 'border-2 border-[var(--sf-danger)] bg-[var(--sf-danger-bg)] shadow-[0_10px_24px_rgba(220,38,38,0.10)]'
      : 'border-2 border-[var(--sf-accent)] bg-[var(--sf-dropzone-ready-bg)] shadow-[var(--sf-shadow-accent)] scale-[1.01]'
    : droppedFile && !validationError
      ? 'border-2 border-[var(--sf-dropzone-filled-border)] bg-[var(--sf-dropzone-filled-bg)] hover:border-[var(--sf-border-strong)] hover:bg-[var(--sf-control-bg-hover)]'
      : 'border-2 border-dashed border-[var(--sf-dropzone-border)] bg-[var(--sf-dropzone-bg)] hover:border-[var(--sf-dropzone-hover-border)] hover:bg-[var(--sf-dropzone-hover-bg)] hover:scale-[1.01] hover:shadow-[var(--sf-shadow-soft)]';

  const showDragMessage = isDragOver;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload HTML file"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFilePicker}
      onKeyDown={handleKeyDown}
      className={`
        group relative flex flex-col items-center justify-center
        w-full flex-1 min-h-[120px] rounded-xl p-6
        transition-all duration-200 ease-[var(--sf-ease-standard)] cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-bg-1)]
        ${dragClass}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".html,.htm,.zip,.css,.png,.jpg,.jpeg,.svg,.webp,.gif,.ttf,.otf,.woff,.woff2,.js"
        multiple
        onChange={handleInputChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      {showDragMessage ? (
        <div className="flex flex-col items-center gap-2 text-center sf-fade-up">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${dragIntent === 'invalid' ? 'bg-[var(--sf-danger-bg)]' : 'bg-[var(--sf-accent-subtle)]'}`}>
            {dragIntent === 'invalid' ? (
              <svg
                className="h-5 w-5 text-[var(--sf-danger-text)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-[var(--sf-accent)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12.75l3 3 7.5-7.5" />
              </svg>
            )}
          </div>
          <p className={`text-sm font-medium ${dragIntent === 'invalid' ? 'text-[var(--sf-danger-text)]' : 'text-[var(--sf-accent-text)]'}`}>
            {dragIntent === 'invalid'
              ? 'Add at least one HTML file or ZIP bundle'
              : 'Release to import files'}
          </p>
          <p className="text-xs text-[var(--sf-text-muted)]">
            {dragIntent === 'invalid'
              ? 'Styles and assets are accepted, but one primary input is required.'
              : 'HTML, CSS, image, font, and JS assets are supported.'}
          </p>
        </div>
      ) : validationError ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sf-danger-bg)]">
            <svg
              className="h-5 w-5 text-[var(--sf-danger-text)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm text-[var(--sf-danger-text)]" role="alert">
            {validationError}
          </p>
          <p className="text-xs text-[var(--sf-text-muted)]">Click or drop a valid file to try again</p>
        </div>
      ) : droppedFile ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sf-success-bg)]">
            <svg
              className="h-5 w-5 text-[var(--sf-success)]"
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
            <p className="text-sm font-medium text-[var(--sf-text)]">{droppedFile.name}</p>
            {droppedFile.count > 1 && (
              <p className="text-xs text-[var(--sf-text-muted)]">
                Includes linked assets for style resolution
              </p>
            )}
            <p className="text-xs text-[var(--sf-text-muted)]">{formatFileSize(droppedFile.size)}</p>
          </div>
          <p className="text-xs text-[var(--sf-text-muted)]">Click or drop another file to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sf-control-bg)]">
            <svg
              className="h-5 w-5 text-[var(--sf-icon-muted)] transition-transform duration-200 group-hover:-translate-y-0.5"
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
            <p className="text-sm font-medium text-[var(--sf-text)]">
              Drop your HTML file here
            </p>
            <p className="text-xs text-[var(--sf-text-muted)] mt-0.5">
              or click to browse - HTML plus CSS/image/font assets
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

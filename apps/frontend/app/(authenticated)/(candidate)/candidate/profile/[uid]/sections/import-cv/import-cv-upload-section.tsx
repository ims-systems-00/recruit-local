'use client';

import { useState } from 'react';
import { FileRejection } from 'react-dropzone';
import { Upload } from 'lucide-react';
import FileUploader, { UploadedFile } from '@/components/file-uploader';
import AttachmentItem from '@/components/attachment-item';
import { useDeleteFileStorage } from '@/services/file-storage';
import { cn } from '@/lib/utils';

// The same limit and types as a training certificate; the CV reader takes all three.
const CV_MAX_BYTES = 10 * 1024 * 1024;
const CV_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
};

const rejectionMessage = (rejections: FileRejection[]) => {
  const code = rejections[0]?.errors[0]?.code;
  if (code === 'file-too-large') return 'The file must be 10MB or smaller.';
  if (code === 'file-invalid-type') return 'Upload a PDF, DOC or DOCX file.';
  return 'This file cannot be uploaded.';
};

/**
 * "Upload From Computer": uploads one CV file to storage. The modal saves it as
 * a CV only when the import starts.
 *
 * `locked` once that has happened: the file then belongs to a saved CV, so it
 * can no longer be deleted from here.
 */
export default function ImportCvUploadSection({
  file,
  onChange,
  locked,
}: {
  file: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  locked: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const { deleteFile, isLoading: isDeleting } = useDeleteFileStorage();

  // Removed from storage too, as onboarding and Documents do.
  const handleRemove = async (item: UploadedFile) => {
    const res = await deleteFile({ fileKey: item.Key });
    if (res?.success) onChange(null);
  };

  if (file) {
    return (
      <AttachmentItem
        item={file}
        isDeleting={isDeleting}
        isViewing={locked}
        onDelete={handleRemove}
      />
    );
  }

  return (
    <div className="space-y-spacing-sm">
      <FileUploader
        enableDropzone
        accept={CV_ACCEPT}
        maxSize={CV_MAX_BYTES}
        onUpload={(files) => {
          setError(files[0] ? null : 'The upload failed. Try again.');
          if (files[0]) onChange(files[0]);
        }}
        onReject={(rejections) => setError(rejectionMessage(rejections))}
      >
        {({ open, disabled, loading, isDragActive, rootProps }) => (
          <div
            {...rootProps}
            onClick={open}
            className={cn(
              'border border-dashed border-border-gray-secondary rounded-2xl p-spacing-5xl flex flex-col items-center justify-center gap-spacing-md cursor-pointer hover:border-border-brand-primary transition-colors bg-bg-gray-soft-primary',
              isDragActive && 'border-border-brand-primary',
              disabled && 'opacity-60 animate-pulse pointer-events-none',
            )}
          >
            <div className="w-10 h-10 flex justify-center items-center rounded-lg bg-others-brand-brand-zero border border-others-brand-light">
              <Upload className="size-5 text-fg-brand-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-label-sm font-label-sm-strong! text-text-gray-primary">
                {loading ? (
                  'Uploading...'
                ) : (
                  <>
                    <span className="text-text-brand-primary underline">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </>
                )}
              </p>
              <p className="text-label-xs text-text-gray-tertiary">
                PDF, DOC, DOCX up to 10MB
              </p>
            </div>
          </div>
        )}
      </FileUploader>
      {error && <p className="text-xs text-text-error-primary">{error}</p>}
    </div>
  );
}

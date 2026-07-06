'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Folder } from 'lucide-react';
import { useDirectUpload, useGetUploadUrl } from '@/services/file-storage';
import { VISIBILITY_ENUM } from '@rl/types';

export type UploadedFile = {
  Name: string;
  Bucket: string;
  Key: string;
  // size: number;
  // type: string;
};

type AttachmentFormProps = {
  onUploadFile: (files: UploadedFile[]) => void;
  multiple?: boolean;
  accept?: Record<string, string[]>;
};

const AttachmentForm = ({
  onUploadFile,
  multiple = true,
  accept = {
    'image/*': ['.jpg', '.png', '.svg'],
  },
}: AttachmentFormProps) => {
  const [loading, setLoading] = useState(false);

  const { getUploadUrl, isLoading } = useGetUploadUrl();
  const { isUploading, uploadFile } = useDirectUpload();

  async function uploadAttachment(file: File) {
    try {
      let response = await getUploadUrl({
        fileName: file.name,
        storageType: VISIBILITY_ENUM.PRIVATE,
      });

      if (!response.success) return null;

      await uploadFile({
        file,
        signedUrl: response.data.signedUrl,
      });

      return {
        Name: response.data.metaInfo.Name,
        Bucket: response.data.metaInfo.Bucket,
        Key: response.data.metaInfo.Key,
        // size: file.size,
        // type: file.type,
      };
    } catch (err) {
      return null;
    }
  }
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setLoading(true);

      const results = await Promise.all(
        acceptedFiles.map((file) => uploadAttachment(file)),
      );

      const uploadedFiles = results.filter(
        (file): file is UploadedFile => file !== null,
      );

      onUploadFile(uploadedFiles);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    disabled: loading,
    multiple,
    accept,
  });

  const isDisabled = isLoading || isUploading || loading;

  return (
    <div
      {...getRootProps()}
      className={cn(
        ' w-full p-spacing-4xl rounded-2xl border border-dashed border-border-gray-secondary flex flex-col justify-center items-center gap-spacing-lg transition-all duration-300',
        isDisabled && 'opacity-60 animate-pulse pointer-events-none',
      )}
    >
      <input disabled={isDisabled} {...getInputProps()} />
      <div className=" w-10 h-10 border border-others-brand-light flex justify-center items-center  bg-others-brand-brand-zero rounded-lg">
        <Folder className="text-others-brand-dark fill-others-brand-dark " />
      </div>
      <div className=" space-y-spacing-xs text-label-sm text-center">
        <p>
          <span className=" text-text-brand-secondary font-label-sm-strong!">
            Drag & Drop
          </span>{' '}
          or Choose {multiple ? 'Files' : 'File'} to Upload
        </p>
        <p>
          Supported Format:{' '}
          {Object.values(accept).flat().join(', ').toUpperCase()}
        </p>
      </div>
    </div>
  );
};

export default AttachmentForm;

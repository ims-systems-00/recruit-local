'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Folder, ImageIcon, Loader2, Plus } from 'lucide-react';
import {
  getSignedViewUrl,
  useDirectUpload,
  useGetUploadUrl,
} from '@/services/file-storage';
import { VISIBILITY_ENUM } from '@rl/types';

export type UploadedFile = {
  Name: string;
  Bucket: string;
  Key: string;
  url: string | null;
};

type PostAttachmentFormProps = {
  onUploadFile: (files: UploadedFile[]) => void;
  multiple?: boolean;
  accept?: Record<string, string[]>;
  isShowImageIcon?: boolean;
};

const PostAttachmentForm = ({
  onUploadFile,
  multiple = true,
  accept = {
    'image/*': ['.jpg', '.png', '.svg'],
  },
  isShowImageIcon = true,
}: PostAttachmentFormProps) => {
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

      const viewUrlResponse = await getSignedViewUrl({
        fileKey: response.data.metaInfo.Key,
      });

      return {
        Name: response.data.metaInfo.Name,
        Bucket: response.data.metaInfo.Bucket,
        Key: response.data.metaInfo.Key,
        url: viewUrlResponse?.success ? viewUrlResponse?.data : null,
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

  const isProcessing = isUploading || loading || isLoading;

  return (
    <div
      {...getRootProps()}
      className={cn(
        'cursor-pointer',
        isDisabled && 'opacity-60 animate-pulse pointer-events-none',
      )}
    >
      <input disabled={isDisabled} {...getInputProps()} />
      {isShowImageIcon && (
        <>
          {isProcessing && (
            <Loader2
              size={16}
              className=" text-fg-gray-secondary animate-spin"
            />
          )}
          {!isProcessing && (
            <ImageIcon className="w-5 h-5 text-fg-gray-secondary " />
          )}
        </>
      )}
      {!isShowImageIcon && (
        <div className=" w-10 h-10 border border-border-gray-primary flex justify-center items-center  bg-bg-gray-soft-primary rounded-lg">
          {isProcessing ? (
            <Loader2
              size={20}
              className=" text-fg-gray-secondary animate-spin"
            />
          ) : (
            <Plus className="w-5 h-5 text-fg-gray-secondary" />
          )}
        </div>
      )}
    </div>
  );
};

export default PostAttachmentForm;

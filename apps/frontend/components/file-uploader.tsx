'use client';

import React, { useCallback, useState } from 'react';
import {
  useDropzone,
  type Accept,
  type DropzoneRootProps,
} from 'react-dropzone';

import { useDirectUpload, useGetUploadUrl } from '@/services/file-storage';
import { VISIBILITY_ENUM } from '@rl/types';

export type UploadedFile = {
  Name: string;
  Bucket: string;
  Key: string;
};

type RenderProps = {
  open: () => void;
  disabled: boolean;
  loading: boolean;
  isDragActive: boolean;
  rootProps: DropzoneRootProps;
};

type FileUploaderProps = {
  children: (props: RenderProps) => React.ReactNode;

  onUpload: (files: UploadedFile[]) => void;

  multiple?: boolean;

  accept?: Accept;

  /**
   * Enable drag & drop.
   * Default: false
   */
  enableDropzone?: boolean;

  /**
   * Storage visibility.
   * Default: PRIVATE
   */
  storageType?: VISIBILITY_ENUM;
};

export default function FileUploader({
  children,
  onUpload,
  multiple = false,
  enableDropzone = false,
  storageType = VISIBILITY_ENUM.PRIVATE,
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.svg', '.webp'],
  },
}: FileUploaderProps) {
  const [loading, setLoading] = useState(false);

  const { getUploadUrl, isLoading } = useGetUploadUrl();
  const { uploadFile, isUploading } = useDirectUpload();

  const uploadAttachment = async (file: File): Promise<UploadedFile | null> => {
    try {
      const response = await getUploadUrl({
        fileName: file.name,
        storageType,
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
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setLoading(true);

      try {
        const uploaded = await Promise.all(acceptedFiles.map(uploadAttachment));

        onUpload(uploaded.filter(Boolean) as UploadedFile[]);
      } finally {
        setLoading(false);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept,

    // We always open manually.
    noClick: true,
    noKeyboard: true,

    // Disable dragging if requested.
    noDrag: !enableDropzone,
  });

  const disabled = loading || isLoading || isUploading;

  return (
    <>
      <input {...getInputProps()} disabled={disabled} />

      {children({
        open,
        disabled,
        loading,
        isDragActive,
        rootProps: enableDropzone ? getRootProps() : ({} as DropzoneRootProps),
      })}
    </>
  );
}

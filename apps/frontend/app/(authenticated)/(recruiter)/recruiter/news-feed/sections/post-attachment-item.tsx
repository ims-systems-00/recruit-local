import React from 'react';
import { UploadedFile } from './post-attachment-form';
import { Loader2, X } from 'lucide-react';
import Image from 'next/image';

export default function PostAttachmentItem({
  item,
  onDelete,
  isDeleting,
  isViewing = false,
}: {
  item: UploadedFile;
  onDelete: (item: UploadedFile) => void;
  isDeleting: boolean;
  isViewing?: boolean;
}) {
  return (
    <div className="w-[135px] h-[90px] min-w-[135px] min-h-[90px] max-w-[135px] max-h-[90px]  relative rounded-lg overflow-hidden border border-border-gray-tertiary">
      <Image
        src={item.url || ''}
        alt={item.Name}
        width={135}
        height={90}
        className="w-full h-full object-cover"
      />
      {!isViewing && (
        <button
          type="button"
          onClick={() => onDelete(item as UploadedFile)}
          disabled={isDeleting}
          className=" cursor-pointer absolute top-1 right-1 bg-others-brand-brand-zero rounded-full p-0.5"
        >
          {isDeleting ? (
            <Loader2
              size={16}
              className=" text-text-brand-primary animate-spin"
            />
          ) : (
            <X size={16} className=" text-text-brand-primary " />
          )}
        </button>
      )}
    </div>
  );
}

import React from 'react';
import { UploadedFile } from './attachment-form';
import { Trash2 } from 'lucide-react';

const getFileType = (name: string) => {
  return name.split('.').pop()?.toLowerCase() || '';
};

export default function AttachmentItem({
  item,
  onDelete,
  isDeleting,
}: {
  item: UploadedFile;
  onDelete: (item: UploadedFile) => void;
  isDeleting: boolean;
}) {
  return (
    <div className=" p-spacing-2xl rounded-2xl bg-bg-gray-soft-primary border border-border-gray-secondary flex justify-between gap-spacing-2xl">
      <div className=" flex gap-spacing-lg items-center ">
        <div className=" min-w-10 w-10 h-10 flex items-center justify-center relative">
          <svg
            width="30"
            height="40"
            viewBox="0 0 30 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M29.9998 7.95719V36C29.9998 38.2091 28.209 40 25.9998 40H4C1.79086 40 0 38.2091 0 36V4C0 1.79086 1.79086 0 4 0H21.3367L29.9998 7.95719Z"
              fill="#F6339A"
            />
          </svg>
          <p className=" absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-white text-[9px]">
            {getFileType(item.Name)}
          </p>
        </div>
        <div className=" space-y-spacing-3xs">
          <p className=" text-label-sm font-label-sm-strong! text-text-gray-primary">
            {item.Name}
          </p>
          {/* <p className=" text-label-sm text-text-gray-tertiary">
                              {item.size}
                            </p> */}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(item as UploadedFile)}
        disabled={isDeleting}
        className=" cursor-pointer"
      >
        <Trash2 size={16} className=" text-fg-gray-tertiary" />
      </button>
    </div>
  );
}

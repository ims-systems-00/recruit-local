import { Bookmark, Forward, Heart } from 'lucide-react';
import React from 'react';

export default function PostActions() {
  return (
    <div className="space-y-spacing-lg border-t border-border-gray-secondary w-full">
      <div className="  py-spacing-2xl px-spacing-4xl ">
        <div className=" grid grid-cols-3 gap-spacing-2xl">
          <div className=" w-full flex items-center justify-center gap-spacing-2xs">
            <Heart className="w-5 h-5 text-text-brand-primary" />
            <p className="text-label-sm font-label-sm-strong! text-text-brand-primary">
              Like
            </p>
          </div>
          <div className=" w-full flex items-center justify-center gap-spacing-2xs">
            <Forward className="w-5 h-5 text-fg-gray-secondary" />
            <p className="text-label-sm font-label-sm-strong! text-text-gray-tertiary">
              Share
            </p>
          </div>
          <div className=" w-full flex items-center justify-center gap-spacing-2xs">
            <Bookmark className="w-5 h-5 text-fg-gray-secondary" />
            <p className="text-label-sm font-label-sm-strong! text-text-gray-tertiary">
              Save
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

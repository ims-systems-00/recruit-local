'use client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import RecruitDefaultLogo from '@/public/images/recruit_default_logo.png';
import { ImageIcon, TextInitial } from 'lucide-react';
import Image from 'next/image';
import PostForm from './post-form';
import React, { useState } from 'react';
import Link from 'next/link';

export default function NewsFeedPost() {
  const [openCreateForm, setOpenCreateForm] = useState(false);
  return (
    <>
      <div className=" space-y-spacing-2xl w-full">
        <div
          onClick={() => setOpenCreateForm(true)}
          className="w-full border border-border-gray-primary shadow-xs flex items-center p-spacing-xl h-12 rounded-lg text-label-md text-text-gray-tertiary"
        >
          <span>Write a post for in Newsfeed</span>
        </div>
        <div className=" flex items-center gap-spacing-lg">
          <div
            onClick={() => setOpenCreateForm(true)}
            className=" cursor-pointer flex gap-spacing-2xs items-center"
          >
            <ImageIcon className=" w-4 h-4 text-fg-gray-secondary" />
            <span className=" text-label-sm text-text-gray-quaternary">
              Media
            </span>
          </div>
          <Link
            className=" flex gap-spacing-2xs items-center"
            href="/recruiter/news-feed/article"
          >
            <TextInitial className=" w-4 h-4 text-fg-gray-secondary" />
            <span className=" text-label-sm text-text-gray-quaternary">
              Article
            </span>
          </Link>
        </div>
      </div>
      <Dialog open={openCreateForm} onOpenChange={setOpenCreateForm}>
        <DialogContent className="sm:max-w-[618px] bg-white">
          <DialogTitle asChild>
            <div className=" flex gap-spacing-2xl items-center">
              <div className=" min-w-12">
                <Image
                  className="max-h-12 max-w-12 w-12 h-12 rounded-full "
                  alt="Logo"
                  src={RecruitDefaultLogo}
                  width={48}
                  height={48}
                />
              </div>
              <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                Boot Tech
              </p>
            </div>
          </DialogTitle>
          <PostForm setOpenCreateForm={setOpenCreateForm} />
        </DialogContent>
      </Dialog>
    </>
  );
}

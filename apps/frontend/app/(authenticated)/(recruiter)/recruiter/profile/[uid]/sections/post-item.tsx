'use client';
import { EllipsisVertical, Heart, Loader2 } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import SavesDefault from '@/public/images/saves_default.png';
import moment from 'moment';

import { useSoftDeletePost } from '@/services/post';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CircleQuestionMark } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DialogTitle } from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import EditPostForm from './edit-post-form';
import { PostData } from '@/services/post/post.type';

export default function PostItem({ post }: { post: PostData }) {
  const [openDeleteAlertDialog, setOpenDeleteAlertDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { softDeletePost, isPending } = useSoftDeletePost();
  return (
    <>
      <div className=" rounded-2xl border border-border-gray-secondary h-full flex flex-col items-center">
        <div className="p-spacing-4xl flex flex-col justify-between h-full gap-y-spacing-4xl w-full">
          <div className="space-y-spacing-4xl">
            <div className=" flex justify-between gap-spacing-lg items-start w-full">
              <div className="flex items-center gap-spacing-lg">
                <div>
                  <Image
                    className="max-h-12 h-12 w-12 rounded-full"
                    alt="SavesDefault"
                    src={post?.creator?.profileImage?.src || SavesDefault}
                    height={48}
                    width={48}
                  />
                </div>
                <div className="space-y-spacing-2xs">
                  <div className=" flex items-center gap-spacing-sm ">
                    <p className=" text-label-md font-label-md-strong! text-text-gray-primary">
                      {post?.creator?.name}
                    </p>
                  </div>

                  <div className=" flex items-center gap-spacing-sm text-text-gray-tertiary ">
                    <p className=" text-label-xs text-text-gray-tertiary capitalize">
                      {post?.creator?.industry}
                    </p>
                    <div className=" inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
                    <p className="text-label-xs text-text-gray-tertiary">
                      {moment(post?.createdAt).format('DD MMM YYYY h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span className=" min-w-5 inline-block cursor-pointer">
                    <EllipsisVertical className=" size-5 text-fg-gray-secondary" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 bg-white">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setOpenEditDialog(true)}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => setOpenDeleteAlertDialog(true)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className=" text-label-sm text-text-gray-tertiary line-clamp-3">
              {post?.text}
            </p>
          </div>
          <div className=" flex gap-spacing-sm items-center justify-between w-full">
            <div className=" w-fit flex gap-spacing-2xs justify-center items-center rounded-full px-spacing-sm py-spacing-3xs bg-bg-gray-soft-secondary border border-border-gray-secondary text-label-sm font-label-sm-strong!  text-text-gray-secondary">
              <Heart className="w-4 h-4 text-text-brand-primary" />
              <span>100</span>
            </div>
            <span className=" cursor-pointer text-label-sm font-label-sm-strong! text-text-gray-secondary">
              View Post
            </span>
          </div>
        </div>
      </div>
      <AlertDialog
        open={openDeleteAlertDialog}
        onOpenChange={setOpenDeleteAlertDialog}
      >
        <AlertDialogContent className="bg-white min-w-[400px] max-w-[400px]! rounded-3xl border border-others-brand-light gap-spacing-5xl">
          <AlertDialogHeader className=" gap-spacing-2xl">
            <div className=" flex justify-center items-center rounded-xl w-12 h-12 min-w-12 min-h-12 bg-others-brand-brand-zero border border-others-brand-light">
              <CircleQuestionMark className="text-others-brand-dark" />
            </div>
            <div className="space-y-spacing-3xs">
              <AlertDialogTitle className="text-label-lg font-label-lg-strong! text-text-gray-primary">
                Are You sure you want to delete?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-body-sm text-text-gray-tertiary">
                One you delete you can not retrieve
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-spacing-2xl">
            <AlertDialogCancel
              disabled={isPending}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-secondary"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => softDeletePost(post._id)}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-white bg-bg-brand-solid-primary"
            >
              {isPending ? 'Deleting...' : 'Yes, Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[692px] bg-bg-gray-soft-primary shadow-xs gap-y-spacing-4xl">
          <DialogTitle asChild>
            <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
              Edit Post
            </h4>
          </DialogTitle>

          <EditPostForm post={post} setOpenEditDialog={setOpenEditDialog} />
        </DialogContent>
      </Dialog>
    </>
  );
}

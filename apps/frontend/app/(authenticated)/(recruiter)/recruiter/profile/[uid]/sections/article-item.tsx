'use client';
import { CircleQuestionMark, EllipsisVertical, Heart } from 'lucide-react';
import React, { useState } from 'react';
import Image from 'next/image';
import RecruitProfileDefault from '@/public/images/recruit_profile_default.svg';
import moment from 'moment';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
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

interface ArticleItemProps {
  title: string;
  image?: string;
  postedAt?: string;
  likes?: number;
  id: string;
}
export default function ArticleItem({
  title,
  image,
  postedAt,
  likes,
  id,
}: ArticleItemProps) {
  const router = useRouter();
  const [openDeleteAlertDialog, setOpenDeleteAlertDialog] = useState(false);
  const { softDeletePost, isPending } = useSoftDeletePost();
  return (
    <>
      <div className=" rounded-2xl border border-border-gray-secondary flex flex-col items-center">
        <div className="p-spacing-4xl flex flex-col justify-between h-full gap-y-spacing-4xl w-full">
          <div className="space-y-spacing-4xl">
            <div className=" flex justify-between gap-spacing-lg items-start w-full">
              <p className=" text-label-md font-label-md-strong! text-text-gray-primary">
                {title}
              </p>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span className=" min-w-5 inline-block cursor-pointer">
                    <EllipsisVertical className=" size-5 text-fg-gray-secondary" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 bg-white">
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/recruiter/news-feed/article/${id}`)
                    }
                    className="cursor-pointer"
                  >
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/recruiter/news-feed/article/${id}/edit`)
                    }
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

            <div>
              <Image
                src={image || RecruitProfileDefault}
                alt="Article Banner"
                width={1000}
                height={120}
                className="rounded-xl max-h-[120px] h-[120px] w-full object-cover"
              />
            </div>
          </div>
          <div className=" flex gap-spacing-sm items-center justify-between w-full">
            <span className=" text-label-sm text-text-gray-tertiary flex items-center gap-spacing-xs">
              <span className=" font-label-sm-strong! text-text-gray-primary">
                Posted
              </span>
              {moment(postedAt).format('DD MMM, YYYY')}
            </span>
            <div className=" w-fit flex gap-spacing-2xs justify-center items-center rounded-full px-spacing-sm py-spacing-3xs bg-bg-gray-soft-secondary border border-border-gray-secondary text-label-sm font-label-sm-strong!  text-text-gray-secondary">
              <Heart className="w-4 h-4 text-text-brand-primary" />
              <span>100</span>
            </div>
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
              onClick={() => softDeletePost(id)}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-white bg-bg-brand-solid-primary"
            >
              {isPending ? 'Deleting...' : 'Yes, Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

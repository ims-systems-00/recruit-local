'use client';
import AttachmentForm, { UploadedFile } from '@/components/attachment-form';
import AttachmentItem from '@/components/attachment-item';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { PostCreateInput } from '@/services/post/post.type';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { postCreateSchema } from '@/services/post/post.validation';
import { useCreatePost } from '@/services/post';
import { Loader2 } from 'lucide-react';
import { useDeleteFileStorage } from '@/services/file-storage';

export default function ArticleForm() {
  const router = useRouter();
  const { deleteFile, isLoading: isDeleting } = useDeleteFileStorage();

  const { createPost, isPending: isCreatingPost } = useCreatePost();
  const methods = useForm<PostCreateInput>({
    resolver: yupResolver(postCreateSchema) as Resolver<PostCreateInput>,
    defaultValues: {
      title: 'Untitled Article',
      text: '',
      imagesStorage: undefined,
    },
    mode: 'onSubmit',
  });

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
    getValues,
  } = methods;

  const onSubmit = async (data: PostCreateInput) => {
    await createPost({
      title: data.title,
      imagesStorage: data.imagesStorage,
      text: data.text,
    });
  };

  const bannerStorage = watch('bannerStorage') || null;

  const handleRemoveAttachment = async (item: UploadedFile) => {
    try {
      const res = await deleteFile({
        fileKey: item.Key,
      });

      if (res?.success) {
        setValue('bannerStorage', null as unknown as UploadedFile, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className=" space-y-spacing-4xl">
      <div className=" flex justify-between items-center gap-spacing-2xl">
        <div className=" space-y-spacing-2xs">
          <h3 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Write an article
          </h3>
        </div>
        <div className=" flex items-center gap-spacing-2xl">
          <Button
            disabled={isCreatingPost}
            onClick={() => router.back()}
            variant="outline"
            type="button"
            className="text-label-sm font-label-sm-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
          >
            Cancel
          </Button>
          <Button
            disabled={isCreatingPost}
            onClick={handleSubmit(onSubmit)}
            className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
          >
            {isCreatingPost && <Loader2 className=" w-4 h-4 animate-spin" />}
            {isCreatingPost ? <span>Posting...</span> : <span>Post now</span>}
          </Button>
        </div>
      </div>
      <div className=" space-y-spacing-4xl">
        <div className=" space-y-spacing-xs">
          <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
            Banner
          </Label>
          <AttachmentForm
            onUploadFile={(files: UploadedFile[]) => {
              setValue('bannerStorage', files[0] as unknown as UploadedFile, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            multiple={false}
          />
          {bannerStorage?.Key && (
            <AttachmentItem
              key={bannerStorage?.Key}
              isDeleting={isDeleting}
              item={bannerStorage as UploadedFile}
              onDelete={handleRemoveAttachment}
            />
          )}
          {errors.bannerStorage && (
            <p className="text-xs text-text-error-primary">
              {errors.bannerStorage.message}
            </p>
          )}
        </div>

        <div className=" space-y-spacing-2xl">
          <div className="space-y-spacing-xs">
            <Label className=" text-label-sm font-label-sm-strong!">
              Title
            </Label>
            <div className=" space-y-2">
              <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                <InputGroupInput
                  type="text"
                  placeholder="Enter your First Name"
                  {...register('title')}
                />
              </InputGroup>
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-spacing-xs col-span-2">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Description
            </Label>
            <div className=" space-y-spacing-sm ">
              <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                <InputGroupTextarea
                  placeholder="Write your article here..."
                  {...register('text')}
                  className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                />
              </InputGroup>
              {errors.text && (
                <p className="text-xs text-text-error-primary">
                  {errors.text.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

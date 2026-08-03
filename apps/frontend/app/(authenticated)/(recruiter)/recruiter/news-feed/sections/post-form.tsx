import { Button } from '@/components/ui/button';
import { ImageIcon, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import PostAttachmentForm, { UploadedFile } from './post-attachment-form';
import { CvCreateInput } from '@/services/cv/cv.type';
import { useCreatePost } from '@/services/post/post.client';
import { Resolver, useForm } from 'react-hook-form';
import { PostCreateInput } from '@/services/post/post.type';
import { postCreateSchema } from '@/services/post';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDeleteFileStorage } from '@/services/file-storage';
import PostAttachmentItem from './post-attachment-item';
import { POST_TYPE_ENUMS } from '@rl/types';

export default function PostForm({
  setOpenCreateForm,
}: {
  setOpenCreateForm: (open: boolean) => void;
}) {
  const { deleteFile, isLoading: isDeleting } = useDeleteFileStorage();

  const [previewImages, setPreviewImages] = useState<UploadedFile[]>([]);

  const { createPost, isPending: isCreatingPost } = useCreatePost();
  const methods = useForm<PostCreateInput>({
    resolver: yupResolver(postCreateSchema) as Resolver<PostCreateInput>,
    defaultValues: {
      title: 'Untitled Post',
      text: '',
      imagesStorage: undefined,

      type: POST_TYPE_ENUMS.POST,
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
      type: POST_TYPE_ENUMS.POST,
    });
    setOpenCreateForm(false);
  };

  const imagesStorage = watch('imagesStorage') || null;

  const handleRemoveAttachment = async (item: UploadedFile) => {
    try {
      const res = await deleteFile({
        fileKey: item.Key,
      });

      if (res?.success) {
        const newImagesStorage = imagesStorage?.filter(
          (image) => image.Key !== item.Key,
        );
        setValue('imagesStorage', newImagesStorage, {
          shouldDirty: true,
          shouldValidate: true,
        });

        setPreviewImages((prev) =>
          prev.filter((image) => image.Key !== item.Key),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadFile = async (files: UploadedFile[]) => {
    const currentImages = getValues('imagesStorage') || [];

    const newImages = files.map(({ url, ...rest }) => rest);

    setValue('imagesStorage', [...currentImages, ...newImages], {
      shouldDirty: true,
      shouldValidate: true,
    });

    setPreviewImages((prev) => [...prev, ...files]);
  };

  return (
    <div className="space-y-spacing-4xl">
      <div className="rounded-lg border border-border-gray-secondary px-spacing-lg py-spacing-sm flex  flex-col gap-spacing-sm">
        <textarea
          {...register('text')}
          placeholder="Write your post here..."
          className=" w-full h-full resize-none min-h-[300px] outline-none border-0 text-label-md text-text-gray-primary"
        />
        <div className="flex items-center flex-wrap gap-spacing-md">
          {previewImages.map((image) => (
            <PostAttachmentItem
              key={image.Key}
              item={image}
              onDelete={handleRemoveAttachment}
              isDeleting={isDeleting}
            />
          ))}
          <PostAttachmentForm
            onUploadFile={handleUploadFile}
            isShowImageIcon={previewImages.length === 0}
          />
        </div>
      </div>
      <div className=" flex justify-end items-center gap-spacing-lg">
        <Button
          disabled={isCreatingPost}
          onClick={() => setOpenCreateForm(false)}
          variant="outline"
          type="button"
          className="text-label-sm font-label-sm-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isCreatingPost}
          className="bg-bg-brand-solid-primary text-white! text-label-sm font-label-sm-strong! cursor-pointer h-10 rounded-lg"
        >
          {isCreatingPost && (
            <Loader2 size={16} className=" text-white animate-spin" />
          )}
          {isCreatingPost ? 'Posting...' : 'Post Now'}
        </Button>
      </div>
    </div>
  );
}

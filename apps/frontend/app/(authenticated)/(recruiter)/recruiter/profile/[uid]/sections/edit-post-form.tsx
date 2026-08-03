import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useUpdatePost } from '@/services/post/post.client';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { PostData, PostUpdateInput } from '@/services/post/post.type';
import { postUpdateSchema } from '@/services/post';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDeleteFileStorage } from '@/services/file-storage';
import { POST_STATUS_ENUMS, POST_TYPE_ENUMS } from '@rl/types';
import PostAttachmentForm, {
  UploadedFile,
} from '../../../news-feed/sections/post-attachment-form';
import PostAttachmentItem from '../../../news-feed/sections/post-attachment-item';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select';

export default function EditPostForm({
  setOpenEditDialog,
  post,
}: {
  setOpenEditDialog: (open: boolean) => void;
  post: PostData;
}) {
  const { deleteFile, isLoading: isDeleting } = useDeleteFileStorage();

  const [previewImages, setPreviewImages] = useState<UploadedFile[]>([]);

  const { updatePost, isPending: isUpdatingPost } = useUpdatePost(
    (response) => {
      setOpenEditDialog(false);
    },
  );
  const methods = useForm<PostUpdateInput>({
    resolver: yupResolver(postUpdateSchema) as Resolver<PostUpdateInput>,
    defaultValues: {
      title: post.title,
      text: post.text,
      imagesStorage:
        post.images?.map((image) => ({
          ...image.storageInformation,
        })) || undefined,

      type: POST_TYPE_ENUMS.POST,
      status: post.status,
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    setPreviewImages(
      post.images?.map((image) => ({
        ...image.storageInformation,
        url: image.src,
      })) || [],
    );
  }, [post.images]);

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
    getValues,
  } = methods;

  const onSubmit = async (data: PostUpdateInput) => {
    await updatePost({
      id: post._id,
      payload: {
        title: data.title,
        imagesStorage: data.imagesStorage,
        text: data.text,
        type: POST_TYPE_ENUMS.POST,
        status: POST_STATUS_ENUMS.LIVE,
      },
    });
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
      <div className="space-y-spacing-sm">
        <div className="space-y-spacing-xs">
          <Label className=" text-label-sm font-label-sm-strong!">Title</Label>
          <div className=" space-y-2">
            <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
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
        <div className="space-y-spacing-xs">
          <Label className="text-label-sm font-label-sm-strong!">Status</Label>

          <div className=" space-y-2">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10! w-full rounded-lg shadow-xs border-border-gray-primary">
                    <SelectValue placeholder="Choose your status" />
                  </SelectTrigger>

                  <SelectContent className=" bg-white">
                    <SelectGroup>
                      <SelectItem value={POST_STATUS_ENUMS.DRAFT}>
                        Draft
                      </SelectItem>
                      <SelectItem value={POST_STATUS_ENUMS.LIVE}>
                        Live
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border-gray-secondary px-spacing-lg py-spacing-sm flex  flex-col gap-spacing-sm">
          <textarea
            {...register('text')}
            placeholder="Write your post here..."
            className=" w-full h-full resize-none min-h-[300px] outline-none border-0 text-label-sm text-text-gray-primary"
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
      </div>
      <div className=" flex justify-end items-center gap-spacing-lg">
        <Button
          disabled={isUpdatingPost}
          onClick={() => setOpenEditDialog(false)}
          variant="outline"
          type="button"
          className="text-label-sm font-label-sm-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isUpdatingPost}
          className="bg-bg-brand-solid-primary text-white! text-label-sm font-label-sm-strong! cursor-pointer h-10 rounded-lg"
        >
          {isUpdatingPost && (
            <Loader2 size={16} className=" text-white animate-spin" />
          )}
          {isUpdatingPost ? 'Updating...' : 'Update'}
        </Button>
      </div>
    </div>
  );
}

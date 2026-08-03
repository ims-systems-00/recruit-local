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
import { PostData, PostUpdateInput } from '@/services/post/post.type';
import { useRouter } from 'next/navigation';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { postUpdateSchema } from '@/services/post/post.validation';
import { useUpdatePost } from '@/services/post';
import { Loader2 } from 'lucide-react';
import { useDeleteFileStorage } from '@/services/file-storage';
import DraftEditor from '@/components/draft-editor/draft-editor';
import { POST_STATUS_ENUMS, POST_TYPE_ENUMS } from '@rl/types';
import { Select, SelectItem, SelectValue } from '@/components/ui/select';
import { SelectContent, SelectTrigger } from '@/components/ui/select';
import { SelectGroup } from '@radix-ui/react-select';

export default function EditArticleForm({ article }: { article: PostData }) {
  const router = useRouter();
  const { deleteFile, isLoading: isDeleting } = useDeleteFileStorage();

  const { updatePost, isPending: isUpdatingPost } = useUpdatePost(
    (response) => {
      router.push(`/recruiter/news-feed/article/${article._id}`);
    },
  );
  const methods = useForm<PostUpdateInput>({
    resolver: yupResolver(postUpdateSchema) as Resolver<PostUpdateInput>,
    defaultValues: {
      title: article.title,
      text: article.text,
      bannerStorage: article.banner?.storageInformation || undefined,
      type: POST_TYPE_ENUMS.ARTICLE,
      status: article.status,
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

  const onSubmit = async (data: PostUpdateInput) => {
    await updatePost({
      id: article._id,
      payload: {
        title: data.title,
        text: data.text,
        bannerStorage: data.bannerStorage,
        type: POST_TYPE_ENUMS.ARTICLE,
        status: data.status,
      },
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
            Edit Article
          </h3>
        </div>
        <div className=" flex items-center gap-spacing-2xl">
          <Button
            disabled={isUpdatingPost}
            onClick={() => router.back()}
            variant="outline"
            type="button"
            className="text-label-sm font-label-sm-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
          >
            Cancel
          </Button>
          <Button
            disabled={isUpdatingPost}
            onClick={handleSubmit(onSubmit)}
            className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
          >
            {isUpdatingPost && <Loader2 className=" w-4 h-4 animate-spin" />}
            {isUpdatingPost ? (
              <span>Updating...</span>
            ) : (
              <span>Update now</span>
            )}
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
            <Label className="text-label-sm font-label-sm-strong!">
              Status
            </Label>

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
          <div className="space-y-spacing-xs col-span-2">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Description
            </Label>

            <div className=" space-y-spacing-sm ">
              <DraftEditor
                value={watch('text')}
                onChange={(_, json) =>
                  setValue('text', json, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />

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

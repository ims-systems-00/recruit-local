'use client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { jobProfileKeys, useUpdateJobProfile } from '@/services/job-profile';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { JobProfileUpdateInput } from '@/services/job-profile/job-profile.type';
import { updateJobProfileSchema } from '@/services/job-profile/job-profile.validation';
import { yupResolver } from '@hookform/resolvers/yup';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { JOB_TITLE_ENUMS, ONBOARDING_STEP_ENUMS } from '@rl/types';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';

export default function JobTitleSection({
  jobProfileId,
}: {
  jobProfileId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<JobProfileUpdateInput>({
    resolver: yupResolver(
      updateJobProfileSchema,
    ) as Resolver<JobProfileUpdateInput>,
  });

  const { updateJobProfile, isPending } = useUpdateJobProfile();

  const onSubmit = (data: JobProfileUpdateInput) => {
    let payload = {
      jobTitle: data.jobTitle || [],
      onboardingStep: ONBOARDING_STEP_ENUMS.JOB_TITLE,
    };
    updateJobProfile({
      id: jobProfileId,
      payload: payload,
      onSuccessCallback: () => {
        queryClient.invalidateQueries({
          queryKey: jobProfileKeys.detail(jobProfileId),
        });
        router.push(
          `/candidate/onboarding/personalisation?step=${ONBOARDING_STEP_ENUMS.INDUSTRY}`,
        );
      },
    });
  };

  // JOB_TITLE_ENUMS

  return (
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col items-center justify-center gap-y-spacing-4xl p-spacing-5xl">
        <div className="w-full flex items-center justify-between gap-spacing-lg">
          <Progress value={10} className="w-full h-2.5" />
          <span className=" text-label-xs font-label-xs-strong! text-text-gray-secondary">
            10%
          </span>
        </div>
        <div className="w-full space-y-spacing-2xs">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
            What type of job role are you looking for ?
          </h4>
          <p className=" text-label-sm text-text-gray-quaternary">
            We will use this to show relevant jobs.
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className=" space-y-spacing-4xl w-full"
        >
          <div className="space-y-spacing-xs">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Job Title
            </Label>
            <div className=" space-y-spacing-3xs">
              <Controller
                name="jobTitle"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <Select
                    value={field.value?.[0] ?? ''}
                    onValueChange={(value) => field.onChange([value])}
                  >
                    <SelectTrigger className="h-12! w-full rounded-lg shadow-xs border-border-gray-primary">
                      <SelectValue placeholder="UI/UX Designer" />
                    </SelectTrigger>

                    <SelectContent className="bg-white">
                      <SelectGroup>
                        {Object.values(JOB_TITLE_ENUMS).map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.jobTitle && (
                <p className="text-sm text-red-500">
                  {errors.jobTitle.message}
                </p>
              )}
            </div>
          </div>

          <div className=" flex justify-between items-center">
            <Button
              disabled={isPending}
              onClick={() =>
                router.push(
                  `/candidate/onboarding/personalisation?step=${ONBOARDING_STEP_ENUMS.CV_UPLOAD}`,
                )
              }
              variant="outline"
              className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-12 rounded-lg text-text-gray-secondary"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-12 rounded-lg"
            >
              {isPending ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

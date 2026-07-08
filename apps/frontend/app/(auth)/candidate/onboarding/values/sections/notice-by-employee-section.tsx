'use client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ONBOARDING_STEP_ENUMS, VISIBILITY } from '@rl/types';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { updateJobProfileSchema } from '@/services/job-profile/job-profile.validation';
import { JobProfileUpdateInput } from '@/services/job-profile/job-profile.type';
import { jobProfileKeys, useUpdateJobProfile } from '@/services/job-profile';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getOnboardingValuesRoute } from '../helpers/onboarding-route';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { Eye, EyeClosed } from 'lucide-react';

export default function NoticeByEmployeeSection({
  jobProfileId,
  existingVisibility,
}: {
  jobProfileId: string;
  existingVisibility: VISIBILITY | undefined;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { updateJobProfile, isPending: isUpdating } = useUpdateJobProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<JobProfileUpdateInput>({
    resolver: yupResolver(
      updateJobProfileSchema,
    ) as Resolver<JobProfileUpdateInput>,
    defaultValues: {
      visibility: existingVisibility,
    },
  });

  const selectedVisibility = watch('visibility');

  const onSubmit = async (data: JobProfileUpdateInput) => {
    const payload = {
      onboardingStep: ONBOARDING_STEP_ENUMS.COMPLETED,
      visibility: data.visibility,
    };

    await updateJobProfile({
      id: jobProfileId,
      payload: payload,
      onSuccessCallback: () => {
        queryClient.invalidateQueries({
          queryKey: jobProfileKeys.detail(jobProfileId),
        });
        router.push(`/system-preparation`);
      },
    });
  };

  return (
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col gap-y-spacing-4xl p-spacing-5xl">
        <div className=" flex items-center justify-between gap-spacing-lg">
          <Progress value={100} className="w-full h-2.5" />
          <span className=" text-label-xs font-label-xs-strong! text-text-gray-secondary">
            {100}%
          </span>
        </div>
        <div className=" space-y-spacing-lg">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
            What is your Experience Level ?
          </h4>
          <p className=" text-label-sm font-label-sm-strong! text-text-gray-quaternary">
            We will use this to find suitable jobs.
          </p>
        </div>
        <div className=" space-y-spacing-lg">
          <div className=" max-h-[500px] overflow-y-auto space-y-spacing-lg">
            <RadioGroup
              value={selectedVisibility ?? ''}
              onValueChange={(value) =>
                setValue('visibility', value as VISIBILITY, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              className="space-y-spacing-lg"
            >
              <FieldLabel
                htmlFor={VISIBILITY.PUBLIC}
                className=" overflow-hidden"
              >
                <Field
                  orientation="horizontal"
                  className=" p-spacing-4xl! bg-bg-gray-soft-primary border-border-gray-secondary! shadow-xs"
                >
                  <FieldContent className=" flex flex-row items-center gap-spacing-4xl">
                    <div className=" min-w-12 flex items-center justify-center w-12 h-12 rounded-xl bg-others-gray-gray-zero border border-others-gray-light shadow-xs">
                      <Eye className=" size-6 text-others-gray-dark" />
                    </div>
                    <div className="space-y-spacing-3xs!">
                      <FieldTitle className=" text-label-md! font-label-md-strong! text-text-gray-primary">
                        Employers can find you In Recruit local
                      </FieldTitle>
                      <FieldDescription className=" text-label-sm! text-text-gray-tertiary">
                        Employers can find your profile through Recruit Local
                        and contact you about jobs. Your identifiable details
                        remain hidden until you respond.
                      </FieldDescription>
                    </div>
                  </FieldContent>

                  <RadioGroupItem
                    value={VISIBILITY.PUBLIC}
                    id={VISIBILITY.PUBLIC}
                  />
                </Field>
              </FieldLabel>

              <FieldLabel
                htmlFor={VISIBILITY.PRIVATE}
                className=" overflow-hidden"
              >
                <Field
                  orientation="horizontal"
                  className=" p-spacing-4xl! bg-bg-gray-soft-primary border-border-gray-secondary! shadow-xs"
                >
                  <FieldContent className=" flex flex-row items-center gap-spacing-4xl">
                    <div className=" min-w-12 flex items-center justify-center w-12 h-12 rounded-xl bg-others-gray-gray-zero border border-others-gray-light shadow-xs">
                      <EyeClosed className=" size-6 text-others-gray-dark" />
                    </div>
                    <div className="space-y-spacing-3xs!">
                      <FieldTitle className=" text-label-md! font-label-md-strong! text-text-gray-primary">
                        Employers can't find you on Recruit local
                      </FieldTitle>
                      <FieldDescription className=" text-label-sm! text-text-gray-tertiary">
                        Only employers you apply to can view your profile on
                        Recruit Local. Other employers can't find your profile
                        or contact you about jobs.
                      </FieldDescription>
                    </div>
                  </FieldContent>

                  <RadioGroupItem
                    value={VISIBILITY.PRIVATE}
                    id={VISIBILITY.PRIVATE}
                  />
                </Field>
              </FieldLabel>
            </RadioGroup>
          </div>
        </div>
        <div className=" flex justify-between items-center">
          <Button
            disabled={isUpdating}
            onClick={() =>
              router.push(
                getOnboardingValuesRoute(ONBOARDING_STEP_ENUMS.VALUES_STEP_5),
              )
            }
            variant="outline"
            className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-12 rounded-lg text-text-gray-secondary"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isUpdating}
            className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-12 rounded-lg"
          >
            {isUpdating ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Search } from 'lucide-react';
import { ONBOARDING_STEP_ENUMS } from '@rl/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import MultiCheckboxSkeleton from './multi-checkbox-skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useInfiniteWorkModes } from '@/services/work-mode/work-mode.client';
import {
  CANDIDATE_MAX_PERSONALISATION_STEP_SELECTION,
  updateJobProfileSchema,
} from '@/services/job-profile/job-profile.validation';
import {
  JobProfileUpdateInput,
  WorkMode,
} from '@/services/job-profile/job-profile.type';
import { jobProfileKeys, useUpdateJobProfile } from '@/services/job-profile';
import { MAX_WORK_MODES_STEP_SELECTION } from '@/services/work-mode/work-mode.validation';

const PAGE_LIMIT = 10;
const SCROLL_THRESHOLD = 80;

export default function WorkModeSection({
  jobProfileId,
  existingWorkModes,
}: {
  jobProfileId: string;
  existingWorkModes: WorkMode[];
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
      workMode: existingWorkModes?.map((workMode) => workMode._id) ?? [],
    },
  });

  const selectedWorkModes = watch('workMode');

  const [savedWorkModes, setSavedWorkModes] = useState<WorkMode[]>([]);

  useEffect(() => {
    setSavedWorkModes(existingWorkModes);
  }, [existingWorkModes]);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  const listFilters = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      search: debouncedSearch || undefined,
    }),
    [page, debouncedSearch],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteWorkModes(listFilters);

  const workModes = data?.pages.flatMap((page) => page.workModes) ?? [];

  const isMaxSelected =
    selectedWorkModes?.length &&
    selectedWorkModes?.length >= MAX_WORK_MODES_STEP_SELECTION;

  const handleToggle = (workMode: WorkMode, checked: boolean) => {
    const current = selectedWorkModes || [];

    if (checked) {
      if (
        current.length >= MAX_WORK_MODES_STEP_SELECTION &&
        !current.includes(workMode._id)
      ) {
        return;
      }

      setValue('workMode', [...current, workMode._id], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setSavedWorkModes((prev) => {
        if (prev.some((item) => item._id === workMode._id)) {
          return prev;
        }

        return [...prev, workMode];
      });
    } else {
      setValue(
        'workMode',
        current.filter((id) => id !== workMode._id),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
      setSavedWorkModes((prev) =>
        prev.filter((item) => item._id !== workMode._id),
      );
    }
  };

  const onSubmit = async (data: JobProfileUpdateInput) => {
    const payload = {
      workMode: data.workMode,
      onboardingStep: ONBOARDING_STEP_ENUMS.WORK_MODE,
    };

    await updateJobProfile({
      id: jobProfileId,
      payload: payload,
      onSuccessCallback: () => {
        queryClient.invalidateQueries({
          queryKey: jobProfileKeys.detail(jobProfileId),
        });
        router.push(
          `/candidate/onboarding/personalisation?step=${ONBOARDING_STEP_ENUMS.LOCATION}`,
        );
      },
    });
  };

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;

      const distanceFromBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (
        distanceFromBottom < SCROLL_THRESHOLD &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const isInitialLoading = isLoading;

  return (
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col gap-y-spacing-4xl p-spacing-5xl">
        <div className=" flex items-center justify-between gap-spacing-lg">
          <Progress value={30} className="w-full h-2.5" />
          <span className=" text-label-xs font-label-xs-strong! text-text-gray-secondary">
            {30}%
          </span>
        </div>
        <div className=" space-y-spacing-lg">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
            What is your preferred work mode?
          </h4>
          <p className=" text-label-sm font-label-sm-strong! text-text-gray-quaternary">
            We will use this to match your work preferences.
          </p>
        </div>
        <div className=" space-y-spacing-lg">
          {Boolean(savedWorkModes?.length) && !isInitialLoading && (
            <div className=" flex items-center gap-spacing-2xl">
              <span className=" whitespace-nowrap text-body-sm text-text-gray-secondary">
                Selected:{' '}
              </span>
              <div className=" flex items-center gap-spacing-2xs flex-wrap">
                {savedWorkModes?.map((item) => (
                  <span
                    key={item._id}
                    className=" cursor-pointer whitespace-nowrap inline-flex items-center justify-center min-h-6 py-spacing-3xs px-spacing-md rounded-lg bg-bg-gray-soft-primary text-body-xs text-others-gray-dark border border-border-gray-primary"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div
            onScroll={handleScroll}
            className=" max-h-[500px] overflow-y-auto space-y-spacing-lg"
          >
            {isInitialLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <MultiCheckboxSkeleton key={index} />
              ))
            ) : workModes.length > 0 ? (
              <>
                {workModes.map((item) => {
                  const isSelected = selectedWorkModes?.includes(item._id);
                  const isDisabled = isMaxSelected && !isSelected;

                  return (
                    <div
                      key={item._id}
                      className={cn(
                        ' flex items-center gap-spacing-lg p-spacing-2xl rounded-2xl border border-border-gray-secondary min-h-14',
                        isDisabled && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <Checkbox
                        id={item._id}
                        name={item._id}
                        checked={isSelected}
                        disabled={isDisabled || false}
                        onCheckedChange={(checked) =>
                          handleToggle(item as WorkMode, checked === true)
                        }
                      />
                      <Label
                        htmlFor={item._id}
                        className={cn(
                          ' text-label-md font-label-md-strong! text-text-gray-secondary',
                          isDisabled && 'cursor-not-allowed',
                        )}
                      >
                        {item.name}
                      </Label>
                    </div>
                  );
                })}
                {isFetchingNextPage && (
                  <div className=" space-y-spacing-lg">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <MultiCheckboxSkeleton key={`loading-${index}`} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className=" flex items-center justify-center p-spacing-5xl border border-border-gray-secondary rounded-lg">
                <p className=" text-label-md font-label-md-strong! text-text-gray-quaternary">
                  {isError
                    ? 'Failed to load work modes'
                    : 'No work modes found'}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className=" flex justify-between items-center">
          <Button
            disabled={isUpdating}
            onClick={() =>
              router.push(
                `/candidate/onboarding/personalisation?step=${ONBOARDING_STEP_ENUMS.EXPERIENCE_LEVEL}`,
              )
            }
            variant="outline"
            type="button"
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

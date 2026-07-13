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
import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import MultiCheckboxSkeleton from './multi-checkbox-skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CANDIDATE_MAX_PERSONALISATION_STEP_SELECTION,
  updateJobProfileSchema,
} from '@/services/job-profile/job-profile.validation';
import { JobProfileUpdateInput } from '@/services/job-profile/job-profile.type';
import { jobProfileKeys, useUpdateJobProfile } from '@/services/job-profile';
import { MAX_JOB_TITLES_STEP_SELECTION } from '@/services/job-title/job-title.validation';
import { useInfiniteJobTitles } from '@/services/job-title/job-title.client';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_LIMIT = 10;
const SCROLL_THRESHOLD = 80;

export default function JobTitleSection({
  jobProfileId,
  existingJobTitles,
}: {
  jobProfileId: string;
  existingJobTitles: string[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    updateJobProfile,
    isPending: isUpdating,
    error,
  } = useUpdateJobProfile();

  console.log('existingJobTitles', existingJobTitles);

  console.log('error', error);

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
      jobTitle: existingJobTitles,
    },
  });

  const selectedJobTitles = watch('jobTitle');

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
  } = useInfiniteJobTitles(listFilters);

  const jobTitles = data?.pages.flatMap((page) => page.jobTitles) ?? [];

  const isMaxSelected =
    selectedJobTitles?.length &&
    selectedJobTitles?.length >= MAX_JOB_TITLES_STEP_SELECTION;

  const handleToggle = (jobTitleId: string, checked: boolean) => {
    const current = selectedJobTitles || [];

    if (checked) {
      if (
        current.length >= MAX_JOB_TITLES_STEP_SELECTION &&
        !current.includes(jobTitleId)
      ) {
        return;
      }

      setValue('jobTitle', [...current, jobTitleId], {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      setValue(
        'jobTitle',
        current.filter((id) => id !== jobTitleId),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  };

  const onSubmit = async (data: JobProfileUpdateInput) => {
    const payload = {
      jobTitle: data.jobTitle,
      onboardingStep: ONBOARDING_STEP_ENUMS.JOB_TITLE,
    };

    await updateJobProfile({
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
          <Progress value={10} className="w-full h-2.5" />
          <span className=" text-label-xs font-label-xs-strong! text-text-gray-secondary">
            {10}%
          </span>
        </div>
        <div className=" space-y-spacing-lg">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
            What type of job role are you looking for ?
          </h4>
          <p className=" text-label-sm font-label-sm-strong! text-text-gray-quaternary">
            We will use this to show relevant jobs.
          </p>
          <InputGroup className="  h-12 rounded-lg shadow-xs border-border-gray-primary">
            <InputGroupInput
              type="text"
              placeholder="Search job title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
            <InputGroupAddon>
              <Search className=" text-fg-gray-tertiary" />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className=" space-y-spacing-lg">
          <div className=" flex items-center justify-between gap-spacing-lg">
            <p className=" text-label-sm font-label-sm-strong! text-text-gray-quaternary">
              Select your top job titles (Maximum{' '}
              {CANDIDATE_MAX_PERSONALISATION_STEP_SELECTION})
            </p>
            <span className=" text-label-sm text-text-gray-quaternary">
              {selectedJobTitles?.length ?? 0}/
              {CANDIDATE_MAX_PERSONALISATION_STEP_SELECTION} selected
            </span>
          </div>
          <div
            onScroll={handleScroll}
            className=" max-h-[500px] overflow-y-auto space-y-spacing-lg"
          >
            {isInitialLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <MultiCheckboxSkeleton key={index} />
              ))
            ) : jobTitles.length > 0 ? (
              <>
                {jobTitles.map((item) => {
                  const isSelected = selectedJobTitles?.includes(item._id);
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
                          handleToggle(item._id, checked === true)
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
                    ? 'Failed to load job titles'
                    : 'No job titles found'}
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
                `/candidate/onboarding/personalisation?step=${ONBOARDING_STEP_ENUMS.CV_UPLOAD}`,
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

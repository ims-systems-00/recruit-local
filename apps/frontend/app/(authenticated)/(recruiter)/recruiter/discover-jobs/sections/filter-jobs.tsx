'use client';
import React, { useMemo, useState } from 'react';

import { CircleX, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteJobs } from '@/services/jobs/jobs.client';
import JobItemSkelaton from './job-item-skelaton';
import CardJobItem from './card-job-item';
import EmptyBox from '@/components/empty-box';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxValue,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  ComboboxChipsInput,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  PERIOD_OPTIONS,
  SALARY_MODE_OPTIONS,
  WORKPLACE_OPTIONS,
} from '@/services/jobs/job.type';

export default function FilterJobs({ onClose }: { onClose: () => void }) {
  const workplaceAnchor = useComboboxAnchor();
  const employmentTypeAnchor = useComboboxAnchor();
  const salaryModeAnchor = useComboboxAnchor();
  const periodAnchor = useComboboxAnchor();

  const [search, setSearch] = useState('');
  const [workplace, setWorkplace] = useState<string[]>([]);
  const [employmentType, setEmploymentType] = useState<string[]>([]);
  const [salaryMode, setSalaryMode] = useState<string[]>([]);
  const [period, setPeriod] = useState<string[]>([]);

  const debouncedSearch = useDebounce(search, 500);

  const filters = useMemo(
    () => ({
      limit: 10,
      clientSearch: debouncedSearch || undefined,

      workplace: workplace.length ? { in: workplace } : undefined,

      employmentType: employmentType.length
        ? { in: employmentType }
        : undefined,

      salaryMode: salaryMode.length ? { in: salaryMode } : undefined,

      period: period.length ? { in: period } : undefined,
    }),
    [debouncedSearch, workplace, employmentType, salaryMode, period],
  );
  const {
    data,
    isLoading: isJobLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteJobs(filters);

  const jobs = data?.pages.flatMap((page) => page.docs) ?? [];

  const sentinelRef = useInfiniteScroll({
    enabled: hasNextPage && !isFetchingNextPage && jobs.length > 0,
    onLoadMore: fetchNextPage,
  });

  return (
    <div className=" p-spacing-4xl">
      <div className=" space-y-spacing-4xl">
        <div className=" flex justify-between items-center gap-spacing-2xl">
          <div className=" space-y-spacing-2xs">
            <h3 className=" text-body-xl font-body-xl-strong! text-text-gray-primary">
              Search Results
            </h3>
            <p className=" capitalize text-label-sm text-text-gray-tertiary">
              {jobs?.length} Matches
            </p>
          </div>
        </div>
        <div className=" flex items-center gap-spacing-lg flex-wrap">
          <InputGroup className=" min-w-[215px] max-w-[215px] h-10 rounded-lg shadow-xs border-border-gray-primary">
            <InputGroupInput
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
            <InputGroupAddon>
              <Search className=" text-fg-gray-tertiary" />
            </InputGroupAddon>
          </InputGroup>
          <div className=" min-w-[215px] max-w-[215px]">
            <Combobox
              multiple
              items={WORKPLACE_OPTIONS}
              autoHighlight
              value={workplace}
              onValueChange={(value) => {
                setWorkplace(value);
              }}
            >
              <ComboboxChips
                ref={workplaceAnchor}
                className=" w-full focus-within:ring-0! min-h-10! rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-primary text-label-md font-label-md-strong!"
              >
                <ComboboxValue>
                  {(values: string[]) => (
                    <>
                      {values.map((value) => (
                        <ComboboxChip
                          key={value}
                          className={' capitalize bg-bg-gray-soft-secondary'}
                        >
                          {value}
                        </ComboboxChip>
                      ))}

                      <ComboboxChipsInput
                        placeholder={!values.length ? 'Eg. Remote' : ''}
                      />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>

              <ComboboxContent
                anchor={workplaceAnchor}
                className={'bg-white ring-border-gray-primary!'}
              >
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className=" min-w-[215px] max-w-[215px]">
            <Combobox
              multiple
              items={EMPLOYMENT_TYPE_OPTIONS}
              autoHighlight
              value={employmentType}
              onValueChange={(value) => {
                setEmploymentType(value);
              }}
            >
              <ComboboxChips
                ref={employmentTypeAnchor}
                className=" w-full focus-within:ring-0! min-h-10! rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-primary text-label-md font-label-md-strong!"
              >
                <ComboboxValue>
                  {(values: string[]) => (
                    <>
                      {values.map((value) => (
                        <ComboboxChip
                          key={value}
                          className={' capitalize bg-bg-gray-soft-secondary'}
                        >
                          {value}
                        </ComboboxChip>
                      ))}

                      <ComboboxChipsInput
                        placeholder={!values.length ? 'Eg. Full Time' : ''}
                      />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>

              <ComboboxContent
                anchor={employmentTypeAnchor}
                className={'bg-white ring-border-gray-primary!'}
              >
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className=" min-w-[180px] max-w-[180px]">
            <Combobox
              multiple
              items={SALARY_MODE_OPTIONS}
              autoHighlight
              value={salaryMode}
              onValueChange={(value) => {
                setSalaryMode(value);
              }}
            >
              <ComboboxChips
                ref={salaryModeAnchor}
                className=" w-full focus-within:ring-0! min-h-10! rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-primary text-label-md font-label-md-strong!"
              >
                <ComboboxValue>
                  {(values: string[]) => (
                    <>
                      {values.map((value) => (
                        <ComboboxChip
                          key={value}
                          className={' capitalize bg-bg-gray-soft-secondary'}
                        >
                          {value}
                        </ComboboxChip>
                      ))}

                      <ComboboxChipsInput
                        placeholder={!values.length ? 'Eg. Negotiable' : ''}
                      />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>

              <ComboboxContent
                anchor={salaryModeAnchor}
                className={'bg-white ring-border-gray-primary!'}
              >
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className=" min-w-[215px] max-w-[215px]">
            <Combobox
              multiple
              items={PERIOD_OPTIONS}
              autoHighlight
              value={period}
              onValueChange={(value) => {
                setPeriod(value);
              }}
            >
              <ComboboxChips
                ref={periodAnchor}
                className=" w-full focus-within:ring-0! min-h-10! rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-primary text-label-md font-label-md-strong!"
              >
                <ComboboxValue>
                  {(values: string[]) => (
                    <>
                      {values.map((value) => (
                        <ComboboxChip
                          key={value}
                          className={' capitalize bg-bg-gray-soft-secondary'}
                        >
                          {value}
                        </ComboboxChip>
                      ))}

                      <ComboboxChipsInput
                        placeholder={!values.length ? 'Eg. Hourly' : ''}
                      />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>

              <ComboboxContent
                anchor={periodAnchor}
                className={'bg-white ring-border-gray-primary!'}
              >
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <Button
            onClick={() => {
              setWorkplace([]);
              setEmploymentType([]);
              setSalaryMode([]);
              setPeriod([]);
              setSearch('');
              onClose();
            }}
            className=" cursor-pointer w-fit p-0! hover:bg-bg-gray-soft-primary bg-bg-gray-soft-primary h-10 text-text-gray-primary! rounded-lg text-label-sm font-label-sm-strong!"
          >
            <CircleX className=" size-5" />
          </Button>
        </div>
      </div>

      <div className=" py-spacing-4xl">
        <div>
          {isJobLoading ? (
            <div className=" grid grid-cols-1 sm:grid-cols-2 gap-spacing-4xl">
              {[1, 2, 3, 4].map((item) => (
                <JobItemSkelaton key={item} />
              ))}
            </div>
          ) : Boolean(jobs?.length) ? (
            <div className=" grid grid-cols-1 sm:grid-cols-2 gap-spacing-4xl">
              {jobs?.map((item) => (
                <CardJobItem key={item._id} job={item} />
              ))}
            </div>
          ) : (
            <EmptyBox
              title="No Jobs Posted Yet!"
              description="Currently, there are no job postings available."
            ></EmptyBox>
          )}

          {Boolean(jobs?.length) && (
            <div ref={sentinelRef} aria-hidden="true">
              {isFetchingNextPage && (
                <div className=" grid grid-cols-1 sm:grid-cols-2 py-spacing-4xl gap-spacing-4xl">
                  {[1, 2].map((item) => (
                    <JobItemSkelaton key={`loading-${item}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { UploadedFile } from '@/components/attachment-form';
import React, { useCallback, useMemo, useState } from 'react';
import { useCvs, useInfiniteCvs } from '@/services/cv';
import { useDebounce } from '@/hooks/useDebounce';
import MultiCheckboxSkeleton from './multi-checkbox-skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Eye, Search } from 'lucide-react';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { VISIBILITY } from '@rl/types';

const SCROLL_THRESHOLD = 80;

export default function CvSelectSection({
  setCv,
  value,
}: {
  setCv: (value: UploadedFile) => void;
  value: UploadedFile;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [selectedCv, setSelectedCv] = useState('');

  const debouncedSearch = useDebounce(search, 500);

  const listFilters = useMemo(
    () => ({
      page,
      limit: 10,
      clientSearch: debouncedSearch || undefined,
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
  } = useInfiniteCvs(listFilters);

  console.log(data);

  const cvs = data?.pages.flatMap((page) => page.docs) ?? [];

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
    <div className=" flex flex-col gap-y-spacing-4xl">
      <div className=" space-y-spacing-xs">
        <p className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
          Search CV
        </p>
        <InputGroup className="  h-10 rounded-lg shadow-xs border-border-gray-primary">
          <InputGroupInput
            type="text"
            placeholder="Search CV..."
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
        <div
          onScroll={handleScroll}
          className=" max-h-[500px] overflow-y-auto space-y-spacing-lg"
        >
          {isInitialLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <MultiCheckboxSkeleton key={index} />
            ))
          ) : cvs.length > 0 ? (
            <>
              <div className=" max-h-[30vh] overflow-y-auto space-y-spacing-lg">
                <RadioGroup
                  value={selectedCv || ''}
                  onValueChange={(value) => {
                    setSelectedCv(value);
                    const cv = cvs.find((cv) => cv._id === value);
                    if (cv) {
                      setCv(cv.resume.storageInformation as UploadedFile);
                    }
                  }}
                  className="space-y-spacing-lg"
                >
                  {cvs.map((item) => (
                    <FieldLabel
                      key={item._id}
                      htmlFor={item._id}
                      className=" overflow-hidden"
                    >
                      <Field
                        orientation="horizontal"
                        className=" p-spacing-2xl! bg-bg-gray-soft-primary border-border-gray-secondary! shadow-xs"
                      >
                        <FieldContent className=" flex flex-row items-center gap-spacing-lg">
                          <div className=" min-w-10 flex items-center justify-center">
                            <svg
                              width="31"
                              height="40"
                              viewBox="0 0 31 40"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M29.9998 7.95719V36C29.9998 38.2091 28.209 40 25.9998 40H4C1.79086 40 0 38.2091 0 36V4C0 1.79086 1.79086 0 4 0H21.3367L29.9998 7.95719Z"
                                fill="#FB2C36"
                              />
                              <g filter="url(#filter0_d_5113_20268)">
                                <path
                                  d="M29.9998 7.95719H22.3367C21.7844 7.95719 21.3367 7.50947 21.3367 6.95719V0L29.9998 7.95719Z"
                                  fill="#FFE2E2"
                                />
                              </g>
                              <path
                                d="M11.8344 25.716C11.8344 26.082 11.7504 26.418 11.5824 26.724C11.4144 27.024 11.1564 27.267 10.8084 27.453C10.4604 27.639 10.0284 27.732 9.51243 27.732H8.55843V30H7.01943V23.682H9.51243C10.0164 23.682 10.4424 23.769 10.7904 23.943C11.1384 24.117 11.3994 24.357 11.5734 24.663C11.7474 24.969 11.8344 25.32 11.8344 25.716ZM9.39543 26.508C9.68943 26.508 9.90843 26.439 10.0524 26.301C10.1964 26.163 10.2684 25.968 10.2684 25.716C10.2684 25.464 10.1964 25.269 10.0524 25.131C9.90843 24.993 9.68943 24.924 9.39543 24.924H8.55843V26.508H9.39543ZM15.0026 23.682C15.6686 23.682 16.2506 23.814 16.7486 24.078C17.2466 24.342 17.6306 24.714 17.9006 25.194C18.1766 25.668 18.3146 26.217 18.3146 26.841C18.3146 27.459 18.1766 28.008 17.9006 28.488C17.6306 28.968 17.2436 29.34 16.7396 29.604C16.2416 29.868 15.6626 30 15.0026 30H12.6356V23.682H15.0026ZM14.9036 28.668C15.4856 28.668 15.9386 28.509 16.2626 28.191C16.5866 27.873 16.7486 27.423 16.7486 26.841C16.7486 26.259 16.5866 25.806 16.2626 25.482C15.9386 25.158 15.4856 24.996 14.9036 24.996H14.1746V28.668H14.9036ZM23.2877 23.682V24.915H20.7137V26.247H22.6397V27.444H20.7137V30H19.1747V23.682H23.2877Z"
                                fill="white"
                              />
                              <defs>
                                <filter
                                  id="filter0_d_5113_20268"
                                  x="18.3367"
                                  y="-1"
                                  width="12.6631"
                                  height="11.9573"
                                  filterUnits="userSpaceOnUse"
                                  color-interpolation-filters="sRGB"
                                >
                                  <feFlood
                                    flood-opacity="0"
                                    result="BackgroundImageFix"
                                  />
                                  <feColorMatrix
                                    in="SourceAlpha"
                                    type="matrix"
                                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                                    result="hardAlpha"
                                  />
                                  <feOffset dx="-1" dy="1" />
                                  <feGaussianBlur stdDeviation="1" />
                                  <feComposite in2="hardAlpha" operator="out" />
                                  <feColorMatrix
                                    type="matrix"
                                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
                                  />
                                  <feBlend
                                    mode="normal"
                                    in2="BackgroundImageFix"
                                    result="effect1_dropShadow_5113_20268"
                                  />
                                  <feBlend
                                    mode="normal"
                                    in="SourceGraphic"
                                    in2="effect1_dropShadow_5113_20268"
                                    result="shape"
                                  />
                                </filter>
                              </defs>
                            </svg>
                          </div>
                          <div className="space-y-spacing-3xs!">
                            <FieldTitle className=" text-label-sm! font-label-sm-strong! text-text-gray-primary">
                              {item.resume.storageInformation.Name}
                            </FieldTitle>
                            <FieldDescription className=" text-label-sm! text-text-gray-tertiary">
                              {item.resume.storageInformation.Key}
                            </FieldDescription>
                          </div>
                        </FieldContent>

                        <RadioGroupItem value={item._id} id={item._id} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </div>
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
                {isError ? 'Failed to load cvs' : 'No cvs found'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
import { ONBOARDING_STEP_ENUMS, VALUE_TYPE_ENUM } from '@rl/types';
import { getOnboardingValuesRoute } from '../helpers/onboarding-route';
import { useRouter } from 'next/navigation';
import { useValues } from '@/services/value/value.client';
import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import ValuesSkeleton from './values-skeleton';

export default function ValuesStepOneSection() {
  const router = useRouter();

  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 500);
  const { values, isLoading, isError, error } = useValues({
    type: {
      in: [
        VALUE_TYPE_ENUM.GROWTH,
        VALUE_TYPE_ENUM.LEARNING,
        VALUE_TYPE_ENUM.CHALLENGE,
        VALUE_TYPE_ENUM.INNOVATION,
      ],
    },
    limit: 50,
    search: debouncedSearch || undefined,
  });
  console.log('values', values);
  return (
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col gap-y-spacing-4xl p-spacing-5xl">
        <div className=" flex items-center justify-between gap-spacing-lg">
          <Progress value={60} className="w-full h-2.5" />
          <span className=" text-label-xs font-label-xs-strong! text-text-gray-secondary">
            60%
          </span>
        </div>
        <div className=" space-y-spacing-lg">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
            How you approach growth, learning, challenges, and innovation?
          </h4>
          <InputGroup className="  h-12 rounded-lg shadow-xs border-border-gray-primary">
            <InputGroupInput
              type="text"
              placeholder="Search your mindset..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
            <InputGroupAddon>
              <Search className=" text-fg-gray-tertiary" />
            </InputGroupAddon>
          </InputGroup>
          <div className=" flex items-center gap-spacing-2xl">
            <span>Top 3 Most Important tags </span>
            <span className=" cursor-pointer inline-flex items-center justify-center min-h-6 py-spacing-3xs px-spacing-md rounded-lg bg-bg-gray-soft-primary text-label-sm font-label-sm-strong! text-others-gray-dark border border-border-gray-primary">
              Growth-oriented
            </span>
            <span className=" cursor-pointer inline-flex items-center justify-center min-h-6 py-spacing-3xs px-spacing-md rounded-lg bg-bg-gray-soft-primary text-label-sm font-label-sm-strong! text-others-gray-dark border border-border-gray-primary">
              Entrepreneurial
            </span>
            <span className=" cursor-pointer inline-flex items-center justify-center min-h-6 py-spacing-3xs px-spacing-md rounded-lg bg-bg-gray-soft-primary text-label-sm font-label-sm-strong! text-others-gray-dark border border-border-gray-primary">
              Proactive
            </span>
          </div>
        </div>
        <div className=" space-y-spacing-lg">
          <p className=" text-label-sm font-label-sm-strong! text-text-gray-quaternary">
            Select your top mindsets (Maximum 5)
          </p>
          <div className=" max-h-[500px] overflow-y-auto space-y-spacing-lg">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <ValuesSkeleton key={index} />
              ))
            ) : values?.length > 0 ? (
              values?.map((item) => (
                <div
                  key={item?._id}
                  className=" flex items-center gap-spacing-lg p-spacing-2xl rounded-2xl border border-border-gray-secondary min-h-14"
                >
                  <Checkbox id={item?._id} name={item?._id} />
                  <Label
                    htmlFor={item?._id}
                    className=" text-label-md font-label-md-strong! text-text-gray-secondary"
                  >
                    {item?.label}
                  </Label>
                </div>
              ))
            ) : (
              <div className=" flex items-center justify-center p-spacing-5xl border border-border-gray-secondary rounded-lg">
                <p className=" text-label-md font-label-md-strong! text-text-gray-quaternary">
                  No values found
                </p>
              </div>
            )}
          </div>
        </div>
        <div className=" flex justify-between items-center">
          <Button
            disabled
            variant="outline"
            className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-12 rounded-lg text-text-gray-secondary"
          >
            Back
          </Button>
          <Button
            onClick={() =>
              router.push(
                getOnboardingValuesRoute(ONBOARDING_STEP_ENUMS.VALUES_STEP_2),
              )
            }
            className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-12 rounded-lg"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import CompanyLogo from '@/public/images/job_default.png';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Search } from 'lucide-react';
import CardJobItem from './card-job-item';
import { usePublicJobs } from '@/services/jobs/jobs.client';
import CardJobItemSkelaton from './card-job-item-skelaton';

export default function FindJobs() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { jobs, isLoading, isError, error, refetch, isFetching } =
    usePublicJobs({
      limit: 3,
    });
  return (
    <section className="pt-spacing-10xl max-w-[1280px] mx-auto px-spacing-5xl">
      <div className=" flex flex-col lg:flex-row gap-spacing-8xl">
        <div className=" flex-1">
          <div className=" space-y-spacing-8xl">
            <div className=" space-y-spacing-4xl">
              <p className=" text-label-sm font-label-sm-strong! text-text-brand-secondary">
                FIND JOBS
              </p>
              <div className=" space-y-spacing-2xl">
                <p className=" text-heading-lg font-heading-lg-strong! text-text-gray-primary">
                  Find your next local opportunity
                </p>
                <p className=" text-body-md text-text-gray-secondary">
                  Find the latest jobs in Artificial Intelligence on JobHub
                </p>
              </div>
              <InputGroup className=" h-14 rounded-lg shadow-xs border-border-gray-primary">
                <InputGroupInput
                  type="text"
                  placeholder="Search By Job Title..."
                  className=" text-label-md placeholder:text-text-gray-quaternary text-text-gray-secondary"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && search.trim()) {
                      router.push(`/jobs?search=${encodeURIComponent(search.trim())}`);
                    }
                  }}
                />
                <InputGroupAddon>
                  <Search className=" text-fg-gray-tertiary" />
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div className=" space-y-spacing-5xl">
              <p className=" text-heading-sm text-text-gray-secondary">
                Featured Jobs
              </p>
              <div className=" space-y-spacing-4xl">
                {isLoading || isFetching ? (
                  <div className=" space-y-spacing-4xl">
                    {[1, 2, 3].map((item) => (
                      <CardJobItemSkelaton key={item} />
                    ))}
                  </div>
                ) : (
                  jobs?.map((item) => <CardJobItem key={item._id} job={item} />)
                )}
                <div className=" flex justify-center items-center">
                  <Link
                    href="/jobs"
                    className=" text-label-md font-label-md-strong! text-text-gray-secondary hover:underline"
                  >
                    View All
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="min-w-[282px] lg:max-w-[282px] w-full space-y-spacing-5xl">
          <div className=" border border-border-gray-secondary p-spacing-4xl rounded-2xl bg-bg-gray-soft-secondary text-center flex flex-col gap-spacing-2xl items-center justify-center">
            <p className=" text-body-xl font-body-xl-strong! text-text-gray-secondary">
              Post a Job Today
            </p>
            <p className=" text-body-md text-text-gray-secondary">
              Everyday 10,000+ potential clients visit our website. Hire
              exclusive talent by posting your job today.
            </p>
            <Link
              href="/login"
              className="text-label-lg w-full rounded-full font-label-lg-strong! flex items-center h-14 text-white justify-center gap-spacing-xs py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary"
            >
              Post Job
            </Link>
          </div>
          <div className=" border border-border-gray-secondary p-spacing-4xl rounded-2xl bg-bg-gray-soft-primary flex flex-col gap-spacing-2xl">
            <p className=" text-body-xl font-body-xl-strong! text-text-gray-secondary">
              Featured Companies
            </p>
            <div className="flex items-center gap-spacing-lg">
              <Avatar className=" size-10 border border-border-gray-tertiary items-center justify-center">
                <AvatarImage src={`${CompanyLogo.src}`} />
                <AvatarFallback>N/A</AvatarFallback>
              </Avatar>
              <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                Dontechi
              </p>
            </div>
            <div className="flex items-center gap-spacing-lg">
              <Avatar className=" size-10 border border-border-gray-tertiary items-center justify-center">
                <AvatarImage src={`${CompanyLogo.src}`} />
                <AvatarFallback>N/A</AvatarFallback>
              </Avatar>
              <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                Ignite
              </p>
            </div>
            <div className="flex items-center gap-spacing-lg">
              <Avatar className=" size-10 border border-border-gray-tertiary items-center justify-center">
                <AvatarImage src={`${CompanyLogo.src}`} />
                <AvatarFallback>N/A</AvatarFallback>
              </Avatar>
              <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                Elevator&CO
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

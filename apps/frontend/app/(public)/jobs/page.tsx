import React, { Suspense } from 'react';
import Banner from './sections/banner';
import JobLists from './sections/lists';
import { Loader2 } from 'lucide-react';

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="size-10 animate-spin text-text-gray-secondary" />
        </div>
      }
    >
      <Banner />
      <JobLists />
    </Suspense>
  );
}

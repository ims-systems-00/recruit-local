import React, { Suspense } from 'react';
import SystemPreparationSection from './system-preparation-section';

export default function SystemPreparation() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          <p>Loading...</p>
        </div>
      }
    >
      <SystemPreparationSection />
    </Suspense>
  );
}

import EmptyBox from '@/components/empty-box';
import React from 'react';

export default function NewsFeed() {
  return (
    <div className=" p-spacing-4xl">
      <EmptyBox
        title="Coming Soon"
        description="We’re building this feature to improve your experience—stay tuned, it’s on the way."
      />{' '}
    </div>
  );
}

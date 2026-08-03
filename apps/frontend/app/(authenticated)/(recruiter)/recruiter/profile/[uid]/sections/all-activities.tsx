import React from 'react';
import PostActivities from './post-activities';
import ArticleActivities from './article-activities';

export default function AllActivities() {
  return (
    <div className=" space-y-spacing-4xl">
      <ArticleActivities carousel={true} />
      <PostActivities />
    </div>
  );
}

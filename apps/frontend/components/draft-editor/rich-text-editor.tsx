'use client';

import dynamic from 'next/dynamic';

const DraftEditor = dynamic(() => import('./draft-editor'), {
  ssr: false,
});
export default function RichTextEditor() {
  return <DraftEditor />;
}

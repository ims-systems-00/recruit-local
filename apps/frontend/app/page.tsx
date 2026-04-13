import RichTextEditor from '@/components/draft-editor/rich-text-editor';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/system-preparation');
  return <></>;
  return (
    <div className="h-screen flex justify-center items-center flex-col gap-spacing-4xl">
      <div className=" max-w-2xl w-full">
        <RichTextEditor />
      </div>
      <Button className="bg-bg-brand-solid-primary">Click me</Button>
    </div>
  );
}

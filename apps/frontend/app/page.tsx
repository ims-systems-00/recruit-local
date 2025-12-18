import RichTextEditor from '@/components/draft-editor/rich-text-editor';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="h-screen flex justify-center items-center flex-col gap-6">
      <div className=" max-w-2xl w-full">
        <RichTextEditor />
      </div>
      <Button className="bg-primary">Click me</Button>
    </div>
  );
}

'use client';
import { Progress } from '@/components/ui/progress';
import AttachmentForm, {
  UploadedFile,
} from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/steps/attachment-form';
import { Button } from '@/components/ui/button';

export default function CvUploadSection() {
  return (
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col items-center justify-center gap-y-spacing-4xl p-spacing-5xl">
        <div className="w-full flex items-center justify-between gap-spacing-lg">
          <Progress value={10} className="w-full h-2.5" />
          <span className=" text-label-xs font-label-xs-strong! text-text-gray-secondary">
            10%
          </span>
        </div>
        <div className="w-full space-y-spacing-2xs">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
            Upload Your CV to Get Started
          </h4>
          <p className=" text-label-sm text-text-gray-quaternary">
            Upload one CV, and Alice AI will pre-fill your details. Just review,
            edit, and continue.
          </p>
        </div>
        <AttachmentForm
          onUploadFile={(files: UploadedFile[]) => {
            console.log(files);
          }}
          multiple={false}
          accept={{
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc', '.docx'],
          }}
        />
        <div className=" w-full flex justify-end">
          <Button
            type="submit"
            className=" cursor-pointer text-base bg-bg-brand-solid-primary border-primary text-white rounded-lg h-10"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

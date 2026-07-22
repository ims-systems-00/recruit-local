'use client';
import AttachmentForm from '@/components/attachment-form';
import AttachmentItem from '@/components/attachment-item';
import { UploadedFile } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useDeleteFileStorage } from '@/services/file-storage';
import { Folder, Upload } from 'lucide-react';
import React, { useState } from 'react';
import CvSelectSection from './cv-select-section';

export default function CvUploadModal({
  open,
  onOpenChange,
  setValue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setValue: (name: string, value: any) => void;
}) {
  const { deleteFile, isLoading: isDeleting } = useDeleteFileStorage();

  const [cv, setCv] = useState<UploadedFile | null>(null);
  const [selectedOption, setSelectedOption] = useState<
    'profile' | 'computer' | null
  >(null);
  const [firstStep, setFirstStep] = useState(true);
  const handleSelectOption = (option: 'profile' | 'computer') => {
    setSelectedOption(option);
  };
  const handleNext = () => {
    setFirstStep(false);
    setCv(null);
  };
  const handlePrevious = () => {
    setFirstStep(true);
  };
  const handleSave = () => {
    setValue('resumeStorage', cv);
    handleReset();
  };

  const handleReset = () => {
    onOpenChange(false);
    setSelectedOption(null);
    setFirstStep(true);
    setCv(null);
  };

  const handleRemoveAttachment = async (item: UploadedFile) => {
    try {
      const res = await deleteFile({
        fileKey: item.Key,
      });

      if (res?.success) {
        setCv(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={handleReset}>
        <DialogContent className="sm:max-w-[692px] bg-bg-gray-soft-primary shadow-xs gap-y-spacing-4xl">
          <DialogTitle asChild>
            <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
              Add your CV
            </h4>
          </DialogTitle>
          {firstStep ? (
            <div className=" grid grid-cols-2 gap-spacing-4xl">
              <div
                onClick={() => handleSelectOption('profile')}
                className={cn(
                  ' w-full p-spacing-4xl rounded-2xl border border-dashed border-border-gray-secondary flex flex-col justify-center items-center gap-spacing-2xl transition-all duration-300',
                  selectedOption === 'profile' && 'border-border-brand-primary',
                )}
              >
                <div className=" w-10 h-10 flex justify-center items-center rounded-lg bg-others-brand-brand-zero border border-others-brand-light ">
                  <Folder className=" size-5 text-fg-brand-primary" />
                </div>
                <p className=" text-label-md font-label-md-strong! text-text-gray-primary">
                  Choose From Profile
                </p>
              </div>
              <div
                onClick={() => handleSelectOption('computer')}
                className={cn(
                  ' w-full p-spacing-4xl rounded-2xl border border-dashed border-border-gray-secondary flex flex-col justify-center items-center gap-spacing-2xl transition-all duration-300',
                  selectedOption === 'computer' &&
                    'border-border-brand-primary',
                )}
              >
                <div className=" w-10 h-10 flex justify-center items-center rounded-lg bg-others-brand-brand-zero border border-others-brand-light ">
                  <Upload className=" size-5 text-fg-brand-primary" />
                </div>
                <p className=" text-label-md font-label-md-strong! text-text-gray-primary">
                  Upload From Computer
                </p>
              </div>
            </div>
          ) : (
            <div>
              {selectedOption === 'profile' ? (
                <div>
                  <CvSelectSection setCv={setCv} value={cv as UploadedFile} />
                </div>
              ) : (
                <div className=" space-y-spacing-sm">
                  <AttachmentForm
                    onUploadFile={(files: UploadedFile[]) => {
                      setCv(files[0] as UploadedFile);
                    }}
                    multiple={false}
                    accept={{
                      'application/pdf': ['.pdf'],
                    }}
                  />
                  {cv?.Key && (
                    <AttachmentItem
                      key={cv?.Key}
                      isDeleting={isDeleting}
                      item={cv as UploadedFile}
                      onDelete={handleRemoveAttachment}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {firstStep ? (
            <div className=" flex justify-end items-center gap-spacing-2xl">
              <Button
                onClick={() => handleReset()}
                variant="outline"
                className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleNext()}
                className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
              >
                Next
              </Button>
            </div>
          ) : (
            <div className=" flex justify-end items-center gap-spacing-2xl">
              <Button
                onClick={() => handlePrevious()}
                variant="outline"
                className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
              >
                Previous
              </Button>
              <Button
                disabled={!cv?.Key || isDeleting}
                onClick={() => handleSave()}
                className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
              >
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CheckCircle2, Folder, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import ImportCvSelectSection from './import-cv-select-section';

type Step = 'choose-method' | 'choose-cv' | 'extracting' | 'congratulation';

interface ImportCvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportCvModal({
  open,
  onOpenChange,
}: ImportCvModalProps) {
  const [step, setStep] = useState<Step>('choose-method');
  const [selectedOption, setSelectedOption] = useState<'profile' | 'computer' | null>(null);
  const [selectedCv, setSelectedCv] = useState<{ id: string; name: string } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);

  const handleSelectOption = (option: 'profile' | 'computer') => {
    setSelectedOption(option);
  };

  const handleNextFromMethod = () => {
    if (!selectedOption) return;
    setStep('choose-cv');
    setSelectedCv(null);
    setUploadedFile(null);
  };

  const handlePreviousToMethod = () => {
    setStep('choose-method');
  };

  const handleReset = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('choose-method');
      setSelectedOption(null);
      setSelectedCv(null);
      setUploadedFile(null);
    }, 250);
  };

  const handleStartExtraction = () => {
    setStep('extracting');
    // Simulated UI extraction timer
    setTimeout(() => {
      setStep('congratulation');
    }, 1500);
  };

  const isContinueDisabled =
    selectedOption === 'profile' ? !selectedCv : !uploadedFile;

  return (
    <Dialog open={open} onOpenChange={handleReset}>
      <DialogContent className="sm:max-w-[692px] bg-bg-gray-soft-primary shadow-xs gap-y-spacing-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle asChild>
          <div className="flex flex-col gap-1">
            <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
              {step === 'choose-method' && 'Import from CV'}
              {step === 'choose-cv' &&
                (selectedOption === 'profile'
                  ? 'Choose CV from Profile'
                  : 'Upload CV from Computer')}
              {step === 'extracting' && 'Extracting CV Data'}
              {step === 'congratulation' && 'Extraction Complete'}
            </h4>
            {step === 'choose-method' && (
              <p className="text-label-sm text-text-gray-tertiary">
                Choose how you would like to import your CV to update your profile.
              </p>
            )}
          </div>
        </DialogTitle>

        {/* STEP 1: CHOOSE METHOD */}
        {step === 'choose-method' && (
          <div className="space-y-spacing-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-4xl">
              {/* Option 1: Choose From Profile (Recommended) */}
              <div
                onClick={() => handleSelectOption('profile')}
                className={cn(
                  'w-full p-spacing-4xl rounded-2xl border border-dashed border-border-gray-secondary flex flex-col justify-center items-center gap-spacing-2xl transition-all duration-300 cursor-pointer hover:border-border-brand-primary',
                  selectedOption === 'profile' &&
                    'border-border-brand-primary bg-bg-brand-soft-primary/20',
                )}
              >
                <div className="w-10 h-10 flex justify-center items-center rounded-lg bg-others-brand-brand-zero border border-others-brand-light">
                  <Folder className="size-5 text-fg-brand-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <p className="text-label-md font-label-md-strong! text-text-gray-primary">
                    Choose From Profile
                  </p>
                  <span className="text-label-xs font-label-xs-strong! text-fg-brand-primary bg-bg-brand-soft-primary px-2.5 py-0.5 rounded-full border border-border-brand-secondary">
                    (Recommended)
                  </span>
                </div>
              </div>

              {/* Option 2: Upload From Computer */}
              <div
                onClick={() => handleSelectOption('computer')}
                className={cn(
                  'w-full p-spacing-4xl rounded-2xl border border-dashed border-border-gray-secondary flex flex-col justify-center items-center gap-spacing-2xl transition-all duration-300 cursor-pointer hover:border-border-brand-primary',
                  selectedOption === 'computer' &&
                    'border-border-brand-primary bg-bg-brand-soft-primary/20',
                )}
              >
                <div className="w-10 h-10 flex justify-center items-center rounded-lg bg-others-brand-brand-zero border border-others-brand-light">
                  <Upload className="size-5 text-fg-brand-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <p className="text-label-md font-label-md-strong! text-text-gray-primary">
                    Upload From Computer
                  </p>
                  <span className="text-label-xs text-text-gray-quaternary">
                    PDF, DOC, DOCX up to 10MB
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-spacing-2xl">
              <Button
                onClick={handleReset}
                variant="outline"
                className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedOption}
                onClick={handleNextFromMethod}
                className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE CV OR UPLOAD */}
        {step === 'choose-cv' && (
          <div className="space-y-spacing-4xl">
            {selectedOption === 'profile' ? (
              <ImportCvSelectSection
                selectedId={selectedCv?.id}
                onSelectCv={(cv) => setSelectedCv(cv)}
              />
            ) : (
              <div className="space-y-spacing-sm">
                {!uploadedFile ? (
                  <label className="border border-dashed border-border-gray-secondary rounded-2xl p-spacing-5xl flex flex-col items-center justify-center gap-spacing-md cursor-pointer hover:border-border-brand-primary transition-colors bg-bg-gray-soft-primary">
                    <div className="w-10 h-10 flex justify-center items-center rounded-lg bg-others-brand-brand-zero border border-others-brand-light">
                      <Upload className="size-5 text-fg-brand-primary" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-label-sm font-label-sm-strong! text-text-gray-primary">
                        <span className="text-text-brand-primary underline">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-label-xs text-text-gray-tertiary">
                        PDF, DOCX up to 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFile({
                            name: file.name,
                            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                          });
                        }
                      }}
                    />
                  </label>
                ) : (
                  <div className="w-full p-spacing-2xl rounded-2xl bg-bg-gray-soft-primary border border-border-gray-secondary flex justify-between items-center gap-spacing-2xl">
                    <div className="flex gap-spacing-lg items-center">
                      <div className="min-w-10 w-10 h-10 flex items-center justify-center relative">
                        <svg
                          width="30"
                          height="40"
                          viewBox="0 0 30 40"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M29.9998 7.95719V36C29.9998 38.2091 28.209 40 25.9998 40H4C1.79086 40 0 38.2091 0 36V4C0 1.79086 1.79086 0 4 0H21.3367L29.9998 7.95719Z"
                            fill="#F6339A"
                          />
                        </svg>
                        <p className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-white text-[9px] font-bold">
                          PDF
                        </p>
                      </div>
                      <div className="space-y-spacing-3xs">
                        <p className="text-label-sm font-label-sm-strong! text-text-gray-primary">
                          {uploadedFile.name}
                        </p>
                        <p className="text-label-xs text-text-gray-tertiary">
                          {uploadedFile.size}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-fg-gray-quaternary hover:text-text-error-primary transition-colors cursor-pointer p-1"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-spacing-2xl">
              <Button
                onClick={handlePreviousToMethod}
                variant="outline"
                className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
              >
                Previous
              </Button>
              <Button
                disabled={isContinueDisabled}
                onClick={handleStartExtraction}
                className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
              >
                Extract & Import
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: WAITING / EXTRACTING STATE */}
        {step === 'extracting' && (
          <div className="py-spacing-5xl flex flex-col items-center justify-center text-center gap-spacing-3xl">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-bg-brand-soft-primary border border-border-brand-secondary flex items-center justify-center">
                <Sparkles className="size-8 text-fg-brand-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-spacing-2xs max-w-md">
              <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                Extracting Data from CV...
              </h4>
              <p className="text-label-sm text-text-gray-tertiary">
                Alice AI is reading and extracting your experience, skills, and background details to update your profile. Please wait a moment.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-label-sm text-text-brand-secondary font-medium pt-spacing-sm">
              <Loader2 className="size-4 animate-spin text-fg-brand-primary" />
              <span>Extracting and organizing profile information...</span>
            </div>
          </div>
        )}

        {/* STEP 4: CONGRATULATION / REVIEW STATE */}
        {step === 'congratulation' && (
          <div className="py-spacing-4xl flex flex-col items-center justify-center text-center gap-spacing-3xl">
            <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#10B981]">
              <CheckCircle2 className="size-8 text-[#10B981]" />
            </div>
            <div className="space-y-spacing-2xs max-w-md">
              <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                Congratulations!
              </h4>
              <p className="text-label-sm text-text-gray-tertiary">
                Data has been successfully extracted from your CV. Please review the details in your profile and make any changes before saving.
              </p>
            </div>

            <div className="w-full bg-bg-gray-soft-secondary/70 rounded-xl p-spacing-xl border border-border-gray-secondary/60 text-left space-y-spacing-xs">
              <p className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Ready for Review:
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-label-xs bg-bg-gray-soft-primary border border-border-gray-primary px-2.5 py-1 rounded-md text-text-gray-primary font-medium">
                  ✓ Personal Information
                </span>
                <span className="text-label-xs bg-bg-gray-soft-primary border border-border-gray-primary px-2.5 py-1 rounded-md text-text-gray-primary font-medium">
                  ✓ Skills & Expertise
                </span>
                <span className="text-label-xs bg-bg-gray-soft-primary border border-border-gray-primary px-2.5 py-1 rounded-md text-text-gray-primary font-medium">
                  ✓ Work Experience
                </span>
                <span className="text-label-xs bg-bg-gray-soft-primary border border-border-gray-primary px-2.5 py-1 rounded-md text-text-gray-primary font-medium">
                  ✓ Education
                </span>
              </div>
            </div>

            <div className="w-full flex justify-end gap-spacing-xl pt-spacing-md">
              <Button
                onClick={handleReset}
                className="w-full sm:w-auto bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg px-spacing-4xl"
              >
                Review Profile
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

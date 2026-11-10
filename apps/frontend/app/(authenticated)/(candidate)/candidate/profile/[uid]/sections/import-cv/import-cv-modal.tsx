'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CheckCircle2, Folder, Loader2, Sparkles, Upload } from 'lucide-react';
import { useParams } from 'next/navigation';
import ImportCvSelectSection from './import-cv-select-section';
import ImportCvUploadSection from './import-cv-upload-section';
import { UploadedFile } from '@/components/file-uploader';
import { useCreateCv, useImportCvToProfile } from '@/services/cv';
import { CvProfileImport } from '@/services/cv/cv.type';

type Step = 'choose-method' | 'choose-cv' | 'extracting' | 'congratulation';

// What the import can put into the edit form, labelled as the form labels it.
const FORM_FIELDS: [keyof CvProfileImport['profile'], string][] = [
  ['name', 'Applicant name'],
  ['jobTitle', 'Job titles'],
  ['summary', 'Description'],
  ['address', 'Address'],
  ['contactNumber', 'Contact number'],
  ['industry', 'Industries'],
  ['workMode', 'Work modes'],
  ['experienceLevel', 'Experience level'],
  ['skills', 'Skills'],
  ['interests', 'Interests'],
];

// The profile sections the import writes rows into straight away.
const ADDED_SECTIONS: [keyof CvProfileImport['added'], string][] = [
  ['experience', 'Work experience'],
  ['education', 'Education'],
  ['training', 'Training'],
];

const hasValue = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value);

const chipClassName =
  'text-label-xs bg-bg-gray-soft-primary border border-border-gray-primary px-2.5 py-1 rounded-md text-text-gray-primary font-medium';

interface ImportCvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with a successful import, to fill the edit form behind the modal. */
  onImported: (result: CvProfileImport) => void;
}

export default function ImportCvModal({
  open,
  onOpenChange,
  onImported,
}: ImportCvModalProps) {
  const [step, setStep] = useState<Step>('choose-method');
  const [selectedOption, setSelectedOption] = useState<'profile' | 'computer' | null>(null);
  const [selectedCv, setSelectedCv] = useState<{ id: string; name: string } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  // The CV saved from the uploaded file, kept so a retry does not save a second one.
  const [createdCvId, setCreatedCvId] = useState<string | null>(null);
  const [result, setResult] = useState<CvProfileImport | null>(null);

  // The profile page's own id, as the Documents tab uses for a new CV.
  const { uid } = useParams<{ uid: string }>();
  const { createCv } = useCreateCv();
  const { importCvToProfile } = useImportCvToProfile();

  const handleSelectOption = (option: 'profile' | 'computer') => {
    setSelectedOption(option);
  };

  const handleNextFromMethod = () => {
    if (!selectedOption) return;
    setStep('choose-cv');
    setSelectedCv(null);
    setUploadedFile(null);
    setCreatedCvId(null);
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
      setCreatedCvId(null);
      setResult(null);
    }, 250);
  };

  // An uploaded file becomes one of the candidate's CVs, as in Documents, so it
  // can be imported like any other. Null when saving failed (the hook has said so).
  const saveUploadedCv = async () => {
    if (createdCvId) return createdCvId;
    if (!uploadedFile) return null;

    const created: { id?: string } = {};
    await createCv({
      payload: {
        jobProfileId: uid,
        title: 'Untitled CV',
        resumeStorage: uploadedFile,
      },
      onSuccessCallback: (cv) => {
        created.id = cv._id;
      },
    });
    setCreatedCvId(created.id ?? null);
    return created.id ?? null;
  };

  const handleStartExtraction = async () => {
    setStep('extracting');
    const cvId =
      selectedOption === 'profile' ? selectedCv?.id : await saveUploadedCv();
    const imported = cvId ? await importCvToProfile(cvId) : null;
    if (imported) onImported(imported);
    // On failure the hook has shown the error; back a step to retry.
    setResult(imported);
    setStep(imported ? 'congratulation' : 'choose-cv');
  };

  const isContinueDisabled =
    selectedOption === 'profile' ? !selectedCv : !uploadedFile;

  const filledFields = result
    ? FORM_FIELDS.filter(([key]) => hasValue(result.profile[key]))
    : [];
  const addedSections = ADDED_SECTIONS.flatMap(([key, label]) => {
    const count = result?.added[key] ?? 0;
    return count ? [{ key, label, count }] : [];
  });
  const foundNothing = filledFields.length === 0 && addedSections.length === 0;

  // The import keeps running on the server once started, so the modal cannot be
  // closed until it has finished.
  const isExtracting = step === 'extracting';

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        if (!isExtracting) handleReset();
      }}
    >
      <DialogContent
        showCloseButton={!isExtracting}
        className="sm:max-w-[692px] bg-bg-gray-soft-primary shadow-xs gap-y-spacing-4xl max-h-[90vh] overflow-y-auto"
      >
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
                    PDF or DOCX, up to 10MB
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
              <ImportCvUploadSection
                file={uploadedFile}
                onChange={setUploadedFile}
                locked={Boolean(createdCvId)}
              />
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
                Alice AI is reading and extracting your experience, skills, and background details to update your profile. This can take up to a minute.
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
                {foundNothing ? 'Nothing to import' : 'Congratulations!'}
              </h4>
              <p className="text-label-sm text-text-gray-tertiary">
                {foundNothing
                  ? "Alice couldn't find any details in this CV to add to your profile."
                  : 'Data has been extracted from your CV. Review the details in your profile, then press Save to keep them.'}
              </p>
            </div>

            {filledFields.length > 0 && (
              <div className="w-full bg-bg-gray-soft-secondary/70 rounded-xl p-spacing-xl border border-border-gray-secondary/60 text-left space-y-spacing-xs">
                <p className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Ready for Review:
                </p>
                <div className="flex flex-wrap gap-2">
                  {filledFields.map(([key, label]) => (
                    <span key={key} className={chipClassName}>
                      ✓ {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!foundNothing && (
              <div className="w-full bg-bg-gray-soft-secondary/70 rounded-xl p-spacing-xl border border-border-gray-secondary/60 text-left space-y-spacing-xs">
                <p className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Already added to your profile:
                </p>
                {addedSections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {addedSections.map(({ key, label, count }) => (
                      <span key={key} className={chipClassName}>
                        ✓ {label} ({count})
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-label-xs text-text-gray-tertiary">
                    Nothing. Work experience, education and training are added
                    only while your profile has none of that kind.
                  </p>
                )}
              </div>
            )}

            <div className="w-full flex justify-end gap-spacing-xl pt-spacing-md">
              <Button
                onClick={handleReset}
                className="w-full sm:w-auto bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg px-spacing-4xl"
              >
                {foundNothing ? 'Close' : 'Review Profile'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

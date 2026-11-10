'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CheckCircle2, Folder, Loader2, Sparkles, Upload } from 'lucide-react';
import { useParams } from 'next/navigation';
import ImportCvSelectSection from './import-cv-select-section';
import ImportCvUploadSection from './import-cv-upload-section';
import ImportCvPickSection, {
  PickKey,
  describeAdded,
  pickItems,
  pickableKeys,
  pickedImport,
} from './import-cv-pick-section';
import { UploadedFile } from '@/components/file-uploader';
import {
  useCreateCv,
  useImportCvRecords,
  useImportCvToProfile,
} from '@/services/cv';
import { CvProfileImport } from '@/services/cv/cv.type';
import { toast } from 'sonner';

type Step = 'choose-method' | 'choose-cv' | 'extracting' | 'choose-fields';

interface ImportCvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called on "Update profile" with only the profile fields the candidate
   * ticked, to fill the edit form behind the modal.
   */
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
  const [picked, setPicked] = useState<PickKey[]>([]);

  // The profile page's own id, as the Documents tab uses for a new CV.
  const { uid } = useParams<{ uid: string }>();
  const { createCv } = useCreateCv();
  const { importCvToProfile } = useImportCvToProfile();
  const { importCvRecords, isPending: isSaving } = useImportCvRecords();

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
      setPicked([]);
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
    if (!imported) {
      // The hook has shown the error; back a step to retry.
      setStep('choose-cv');
      return;
    }
    setResult(imported);
    // Everything that can be ticked starts ticked.
    setPicked(pickableKeys(pickItems(imported)));
    setStep('choose-fields');
  };

  // Ticked sections are saved first: if that fails, the modal stays open with
  // the error, nothing has reached the form, and the candidate can retry.
  const handleUpdateProfile = async () => {
    if (!result) return;
    const { profile, records } = pickedImport(result, picked);

    if (Object.values(records).some((rows) => rows.length > 0)) {
      const added = await importCvRecords(records);
      if (!added) return;
      const summary = describeAdded(added);
      toast.success(
        summary
          ? `Added to your profile: ${summary}.`
          : 'Those are already on your profile.',
      );
    }

    onImported({ ...result, profile });
    handleReset();
  };

  const isContinueDisabled =
    selectedOption === 'profile' ? !selectedCv : !uploadedFile;

  const items = result ? pickItems(result) : [];
  const canPick = items.length > 0;

  // The import keeps running on the server once started, and so does a save,
  // so the modal cannot be closed until either has finished.
  const isExtracting = step === 'extracting';
  const isBusy = isExtracting || isSaving;

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        if (!isBusy) handleReset();
      }}
    >
      <DialogContent
        showCloseButton={!isBusy}
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
              {step === 'choose-fields' &&
                (canPick ? 'Choose What to Update' : 'Extraction Complete')}
            </h4>
            {step === 'choose-method' && (
              <p className="text-label-sm text-text-gray-tertiary">
                Choose how you would like to import your CV to update your profile.
              </p>
            )}
            {step === 'choose-fields' && canPick && (
              <p className="text-label-sm text-text-gray-tertiary">
                Untick anything you want to keep as it is.
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

        {/* STEP 4: CHOOSE WHAT TO UPDATE */}
        {step === 'choose-fields' && (
          <div className="flex flex-col items-center text-center gap-spacing-3xl">
            {canPick ? (
              <ImportCvPickSection
                items={items}
                picked={picked}
                onChange={setPicked}
                disabled={isSaving}
              />
            ) : (
              <div className="pt-spacing-4xl flex flex-col items-center gap-spacing-3xl">
                <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#10B981]">
                  <CheckCircle2 className="size-8 text-[#10B981]" />
                </div>
                <div className="space-y-spacing-2xs max-w-md">
                  <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                    Nothing to import
                  </h4>
                  <p className="text-label-sm text-text-gray-tertiary">
                    Alice couldn&apos;t find any details in this CV to add to
                    your profile.
                  </p>
                </div>
              </div>
            )}

            <div className="w-full flex flex-col sm:flex-row justify-end gap-spacing-2xl">
              {canPick ? (
                <>
                  <Button
                    onClick={handleReset}
                    disabled={isSaving}
                    variant="outline"
                    className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={picked.length === 0 || isSaving}
                    onClick={handleUpdateProfile}
                    className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
                  >
                    {isSaving && <Loader2 className="size-4 animate-spin" />}
                    {isSaving ? 'Saving…' : 'Update profile'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleReset}
                  className="w-full sm:w-auto bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg px-spacing-4xl"
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

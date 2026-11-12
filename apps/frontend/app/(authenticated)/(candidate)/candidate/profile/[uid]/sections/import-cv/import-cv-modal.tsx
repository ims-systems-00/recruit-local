'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Folder,
  Hand,
  HandCoins,
  Loader2,
  Upload,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import ImportCvSelectSection from './import-cv-select-section';
import ImportCvUploadSection from './import-cv-upload-section';
import ImportCvProgressSection from './import-cv-progress-section';
import ImportCvPickSection, {
  Picked,
  countPicked,
  pickAll,
  pickedImport,
  pickedSummary,
} from './import-cv-pick-section';
import ImportCvDoneSection, { SummaryGroup } from './import-cv-done-section';
import { UploadedFile } from '@/components/file-uploader';
import {
  useCreateCv,
  useImportCvRecords,
  useImportCvToProfile,
} from '@/services/cv';
import { CvProfileImport, CvRecordCounts } from '@/services/cv/cv.type';

type Step =
  | 'choose-method'
  | 'choose-cv'
  | 'extracting'
  | 'choose-fields'
  | 'done';

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
  const [selectedOption, setSelectedOption] = useState<
    'profile' | 'computer' | null
  >(null);
  const [selectedCv, setSelectedCv] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  // The CV saved from the uploaded file, kept so a retry does not save a second one.
  const [createdCvId, setCreatedCvId] = useState<string | null>(null);
  const [result, setResult] = useState<CvProfileImport | null>(null);
  // Null until there is a result to pick from.
  const [picked, setPicked] = useState<Picked | null>(null);
  // What "Update Profile" did, shown on the last step.
  const [summary, setSummary] = useState<SummaryGroup[] | null>(null);

  // The profile page's own id, as the Documents tab uses for a new CV.
  const { uid } = useParams<{ uid: string }>();
  const { createCv, isPending: isSavingCv } = useCreateCv();
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
      setPicked(null);
      setSummary(null);
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
    setPicked(pickAll(imported));
    setStep('choose-fields');
  };

  // Ticked rows are saved first: if that fails, the modal stays open with the
  // error, nothing has reached the form, and the candidate can retry. Then the
  // ticked fields fill the form behind the modal, and the summary says so.
  const handleUpdateProfile = async () => {
    if (!result || !picked) return;
    const { profile, records } = pickedImport(result, picked);

    let added: CvRecordCounts | null = null;
    if (Object.values(records).some((rows) => rows.length > 0)) {
      added = await importCvRecords(records);
      if (!added) return;
    }

    onImported({ ...result, profile });
    setSummary(pickedSummary(result, picked, added));
    setStep('done');
  };

  const isContinueDisabled =
    selectedOption === 'profile' ? !selectedCv : !uploadedFile;

  const canPick = result ? countPicked(pickAll(result)) > 0 : false;
  // The CV only repeated what the profile has.
  const allOnProfile =
    result !== null && Object.values(result.alreadyOnProfile).some(Boolean);

  // The import keeps running on the server once started, and so does a save,
  // so the modal cannot be closed until either has finished.
  const isExtracting = step === 'extracting';
  const isBusy = isExtracting || isSaving;

  // The icon above the title, on the steps the design gives one.
  const StepIcon = isExtracting ? Hand : step === 'done' ? HandCoins : null;

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        if (!isBusy) handleReset();
      }}
    >
      <DialogContent
        showCloseButton={!isBusy}
        className={cn(
          'rounded-3xl bg-bg-gray-soft-primary shadow-xl gap-y-spacing-4xl max-h-[90vh] overflow-y-auto',
          // The progress step is a narrow card in the design.
          isExtracting ? 'sm:max-w-[550px]' : 'sm:max-w-[816px]',
        )}
      >
        <DialogTitle asChild>
          <div className="flex flex-col gap-1">
            {StepIcon && (
              <div className="mb-spacing-2xl flex size-12 items-center justify-center rounded-xl bg-others-brand-brand-zero border border-others-brand-light">
                <StepIcon className="size-6 text-others-brand-dark" />
              </div>
            )}
            <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
              {step === 'choose-method' && 'Import from CV'}
              {step === 'choose-cv' &&
                (selectedOption === 'profile'
                  ? 'Choose CV From Your Profile'
                  : 'Upload CV from Computer')}
              {step === 'extracting' && 'Processing Your CV'}
              {step === 'choose-fields' &&
                (canPick ? 'Update Profile from CV' : 'Extraction Complete')}
              {step === 'done' && 'Congratulations!!!'}
            </h4>
            {step === 'choose-method' && (
              <p className="text-label-sm text-text-gray-tertiary">
                Choose how you would like to import your CV to update your
                profile.
              </p>
            )}
            {step === 'extracting' && (
              <p className="text-label-sm text-text-gray-tertiary">
                We&apos;re extracting your information to update your profile.
              </p>
            )}
            {step === 'choose-fields' && canPick && (
              <p className="text-label-sm text-text-gray-tertiary">
                Tick items to add to your profile. Untick to leave unchanged,
                then click Update.
              </p>
            )}
            {step === 'done' && (
              <p className="text-label-sm text-text-gray-tertiary">
                Your CV details have been extracted. Review them in your profile
                and click Review to view the changes.
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
                Back
              </Button>
              <Button
                disabled={isContinueDisabled}
                onClick={handleStartExtraction}
                className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
              >
                Import from This CV
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: WAITING / EXTRACTING STATE */}
        {step === 'extracting' && (
          // An uploaded file is first saved as a CV; a retry skips that.
          <ImportCvProgressSection
            label={
              isSavingCv ? 'Saving your CV...' : 'Extracting CV details...'
            }
          />
        )}

        {/* STEP 4: CHOOSE WHAT TO UPDATE */}
        {step === 'choose-fields' && (
          <div className="flex flex-col gap-spacing-4xl">
            {canPick && result && picked ? (
              <ImportCvPickSection
                result={result}
                picked={picked}
                onChange={setPicked}
                disabled={isSaving}
              />
            ) : (
              <div className="pt-spacing-4xl flex flex-col items-center text-center gap-spacing-3xl">
                <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#10B981]">
                  <CheckCircle2 className="size-8 text-[#10B981]" />
                </div>
                <div className="space-y-spacing-2xs max-w-md">
                  <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                    Nothing to import
                  </h4>
                  <p className="text-label-sm text-text-gray-tertiary">
                    {allOnProfile
                      ? 'Everything Alice found in this CV is already on your profile.'
                      : "Alice couldn't find any details in this CV to add to your profile."}
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
                    disabled={!picked || countPicked(picked) === 0 || isSaving}
                    onClick={handleUpdateProfile}
                    className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
                  >
                    {isSaving && <Loader2 className="size-4 animate-spin" />}
                    {isSaving ? 'Saving…' : 'Update Profile'}
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

        {/* STEP 5: WHAT WAS UPDATED */}
        {step === 'done' && summary && (
          <div className="flex flex-col gap-spacing-4xl">
            <ImportCvDoneSection groups={summary} />

            {/* Import from CV is offered only while the edit form is open, so
                closing shows the form, already filled in, to review and Save.
                Cancel leaves it filled too: the rows are saved already. */}
            <div className="w-full flex flex-col sm:flex-row justify-end gap-spacing-2xl">
              <Button
                onClick={handleReset}
                variant="outline"
                className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
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

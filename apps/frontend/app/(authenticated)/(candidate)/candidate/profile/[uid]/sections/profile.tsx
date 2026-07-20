'use client';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RecruitProfileDefault from '@/public/images/recruit_profile_default.svg';
import RecruitDefaultLogo from '@/public/images/recruit_default_logo.png';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import About from './about';
import EditProfile from './edit-profile';
import { Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  JobProfileUpdateInput,
  JobProfileData,
} from '@/services/job-profile/job-profile.type';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { updateJobProfileSchema } from '@/services/job-profile/job-profile.validation';
import { useUpdateJobProfile } from '@/services/job-profile/job-profile.client';
import WorkExperience from './work-experience/work-experience';
import EducationQualification from './education-qualification/education-qualification';
import Trainings from './trainings/trainings';
import TakenTests from './taken-tests/taken-tests';
// import Documents from './document/documents';
import Applied from './applied/applied';
import Documents from './documents/documents';
import Values from './values/values';
import { VISIBILITY } from '@rl/types';
import FileUploader from '@/components/file-uploader';
import { Camera, CircleQuestionMark, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import Saves from './saved/saves';

export default function Profile({
  jobProfileData,
}: {
  jobProfileData: JobProfileData;
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  const [jobProfileDetails, setJobProfileDetails] = useState(jobProfileData);

  console.log('jobProfileDetails', jobProfileDetails);

  const [showProgreesInfo, setShowProgreesInfo] = useState(true);
  const [showOpenToWorkAlert, setShowOpenToWorkAlert] = useState(false);

  // const existingJobTitles = useMemo(
  //   () => (jobProfileDetails?.jobTitle as unknown as JobTitle[]) ?? [],
  //   [jobProfileDetails?.jobTitle],
  // );

  const { updateJobProfile, isPending } = useUpdateJobProfile();
  const methods = useForm<JobProfileUpdateInput>({
    resolver: yupResolver(
      updateJobProfileSchema,
    ) as Resolver<JobProfileUpdateInput>,
    defaultValues: {
      name: jobProfileDetails?.name || '',
      jobTitle: jobProfileDetails?.jobTitle?.map((jobTitle) => jobTitle._id),
      email: jobProfileDetails?.email || '',
      contactNumber: jobProfileDetails?.contactNumber || '',
      address: jobProfileDetails?.address || '',
      summary: jobProfileDetails?.summary || '',
      skills: jobProfileDetails?.skills || '',
      interests: jobProfileDetails?.interests || '',
      portfolioUrl: jobProfileDetails?.portfolioUrl || '',
      keywords: jobProfileDetails?.keywords || [],
      languages: jobProfileDetails?.languages || [],
      visibility:
        (jobProfileDetails?.visibility as VISIBILITY) || VISIBILITY.PUBLIC,
      experienceLevel: jobProfileDetails?.experienceLevel?._id || '',
      industry: jobProfileDetails?.industry?.map((industry) => industry._id),
      workMode: jobProfileDetails?.workMode?.map((workMode) => workMode._id),
      coverPhotoStorage:
        jobProfileDetails?.coverPhoto?.storageInformation || undefined,
      profileImageStorage:
        jobProfileDetails?.profileImage?.storageInformation || undefined,
    },
    mode: 'onSubmit',
  });

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = methods;

  const onSubmit = async (data: JobProfileUpdateInput) => {
    const payload = {
      ...data,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    await updateJobProfile({
      id: jobProfileDetails._id,
      payload: cleanPayload,
      onSuccessCallback: (newData) => {
        setJobProfileDetails((prev) => ({ ...prev, ...newData }));
        setIsEditMode(false);
        setActiveTab('about');
      },
    });
  };

  const tabs = [
    {
      value: 'about',
      label: 'About',
      component: <About profile={jobProfileDetails} />,
      editable: false,
    },
    {
      value: 'values',
      label: 'Values',
      component: <Values profile={jobProfileDetails} />,
    },
    {
      value: 'work-experience',
      label: 'Work Experience',
      component: <WorkExperience />,
      editable: false,
    },
    {
      value: 'education-qualification',
      label: 'Education Qualification',
      component: <EducationQualification />,
      editable: false,
    },
    {
      value: 'trainings',
      label: 'Trainings',
      component: <Trainings />,
      editable: false,
    },
    {
      value: 'documents',
      label: 'Documents',
      component: <Documents />,
      editable: false,
    },
    {
      value: 'taken-tests',
      label: 'Taken Tests',
      component: <TakenTests />,
      editable: false,
    },

    {
      value: 'applied',
      label: 'Applied',
      component: <Applied />,
      editable: false,
    },
    {
      value: 'saved',
      label: 'Saved',
      component: <Saves />,
      editable: false,
    },
  ];

  const visibleTabs = useMemo(() => {
    if (!isEditMode) return tabs;
    return tabs.filter((tab) => tab.editable);
  }, [isEditMode, tabs]);

  const handleEdit = useCallback(() => {
    setIsEditMode(true);
    setActiveTab('about');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setActiveTab('about');
  }, []);

  const completionProgress = jobProfileDetails?.completion?.percentage || 0; // 0-100

  const size = 160;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - completionProgress / 100);

  useEffect(() => {
    reset({
      name: jobProfileDetails?.name || '',
      email: jobProfileDetails?.email,
      contactNumber: jobProfileDetails?.contactNumber,
      address: jobProfileDetails?.address,
      summary: jobProfileDetails?.summary,
      skills: jobProfileDetails?.skills,
      interests: jobProfileDetails?.interests,
      portfolioUrl: jobProfileDetails?.portfolioUrl,
      keywords: jobProfileDetails?.keywords,
      languages: jobProfileDetails?.languages,
      profileImageStorage: jobProfileDetails?.profileImage?.storageInformation,
      coverPhotoStorage: jobProfileDetails?.coverPhoto?.storageInformation,
      visibility: jobProfileDetails?.visibility as VISIBILITY,
      experienceLevel: jobProfileDetails?.experienceLevel?._id || '',
      industry: jobProfileDetails?.industry?.map((industry) => industry._id),
      workMode: jobProfileDetails?.workMode?.map((workMode) => workMode._id),
      jobTitle: jobProfileDetails?.jobTitle?.map((jobTitle) => jobTitle._id),
    });
  }, [
    jobProfileDetails?.profileImage?.storageInformation,
    jobProfileDetails?.coverPhoto?.storageInformation,
  ]);

  return (
    <div>
      <header className=" p-spacing-4xl rounded-2xl">
        <div className=" h-[244px] relative">
          <div>
            <Image
              className="max-h-[244px] rounded-3xl w-full object-cover h-full"
              alt="Recruit Profile Default"
              src={jobProfileDetails?.coverPhoto?.src || RecruitProfileDefault}
              height={244}
              width={1900}
            />
            {isEditMode && (
              <FileUploader
                onUpload={async (files) => {
                  await updateJobProfile({
                    id: jobProfileDetails._id,
                    payload: {
                      coverPhotoStorage: files[0],
                    },
                    onSuccessCallback: (newData) => {
                      setJobProfileDetails((prev) => ({ ...prev, ...newData }));
                    },
                  });
                }}
              >
                {({ open, disabled }) => (
                  <Button
                    type="button"
                    disabled={disabled || isPending}
                    onClick={open}
                    className="hover:bg-bg-gray-soft-primary cursor-pointer h-9 z-10 absolute top-6 right-6 bg-bg-gray-soft-primary border border-border-gray-primary flex items-center justify-center"
                  >
                    <Camera className=" size-5 text-fg-gray-secondary" />
                    <span className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                      Edit Cover Photo
                    </span>
                  </Button>
                )}
              </FileUploader>
            )}
          </div>

          <div className=" w-40 h-40 absolute -bottom-[100px] left-0">
            <div className="relative w-40 h-40">
              {isEditMode && (
                <FileUploader
                  onUpload={async (files) => {
                    console.log(files);
                    await updateJobProfile({
                      id: jobProfileDetails._id,
                      payload: {
                        profileImageStorage: files[0],
                      },
                      onSuccessCallback: (newData) => {
                        setJobProfileDetails((prev) => ({
                          ...prev,
                          ...newData,
                        }));
                      },
                    });
                  }}
                >
                  {({ open, disabled }) => (
                    <Button
                      type="button"
                      disabled={disabled}
                      onClick={open}
                      className=" hover:bg-others-gray-gray-zero cursor-pointer z-10 absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-12 h-12 bg-others-gray-gray-zero rounded-full flex items-center justify-center"
                    >
                      <Camera className=" size-7 text-others-gray-default" />
                    </Button>
                  )}
                </FileUploader>
              )}
              {!isEditMode && (
                <svg
                  className=" stroke-bg-brand-solid-primary absolute inset-0 -rotate-90 pointer-events-none"
                  width={size}
                  height={size}
                >
                  {/* Background Ring */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={strokeWidth}
                  />

                  {/* Progress */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="inherit"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-300"
                  />
                </svg>
              )}
              <Image
                className={cn(
                  'max-h-40 max-w-40 w-40 h-40 rounded-full object-cover',
                  isEditMode && 'blur-[2px]',
                )}
                alt="Logo"
                src={jobProfileDetails?.profileImage?.src || RecruitDefaultLogo}
                width={160}
                height={160}
              />
            </div>
          </div>
        </div>
        <div className=" pl-44 flex justify-between items-center gap-4 py-spacing-xl">
          <div className=" space-y-spacing-2xs">
            <h4 className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
              {jobProfileDetails?.name || 'N/A'}
            </h4>
            <p className=" text-body-sm text-text-gray-tertiary">
              {jobProfileDetails?.jobTitle?.length
                ? jobProfileDetails?.jobTitle
                    ?.map((title) => title.name)
                    .join(' | ')
                : 'N/A'}
            </p>
            <div className=" flex items-center gap-spacing-xs">
              {/* {jobProfileDetails?.linkedin && (
                <Link
                  href={jobProfileDetails.linkedIn}
                  target="_blank"
                  className=" h-9 w-9 border border-border-gray-secondary rounded-sm flex justify-center items-center"
                >
                  <Linkedin className=" text-fg-gray-secondary size-4" />
                </Link>
              )}
              {jobProfileDetails?.website && (
                <Link
                  href={jobProfileDetails.website}
                  target="_blank"
                  className=" h-9 w-9 border border-border-gray-secondary rounded-sm flex justify-center items-center"
                >
                  <Globe className=" text-fg-gray-secondary size-4" />
                </Link>
              )} */}
            </div>
          </div>
          <div className=" space-y-spacing-2xl">
            <div className="flex gap-2 justify-end">
              {isEditMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isPending}
                    className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isPending}
                    className="cursor-pointer h-10 rounded-lg bg-bg-brand-solid-primary text-white! text-label-sm font-label-sm-strong!"
                  >
                    {isPending ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
                >
                  Edit Profile
                </Button>
              )}
            </div>
            {!isEditMode && (
              <div className="flex items-center gap-spacing-sm justify-end">
                <span className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Open to work
                </span>

                <Switch
                  checked={jobProfileDetails?.visibility === VISIBILITY.PUBLIC}
                  disabled={isPending}
                  onCheckedChange={async (v) => {
                    if (v) {
                      await updateJobProfile({
                        id: jobProfileDetails._id,
                        payload: {
                          visibility: VISIBILITY.PUBLIC,
                        },
                        onSuccessCallback: (newData) => {
                          setJobProfileDetails((prev) => ({
                            ...prev,
                            ...newData,
                          }));
                        },
                      });
                      return;
                    }

                    setShowOpenToWorkAlert(true);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className=" bg-bg-gray-soft-quaternary data-[state=checked]:bg-bg-brand-solid-primary"
                />
              </div>
            )}
          </div>
        </div>
      </header>
      {!isEditMode && completionProgress < 100 && showProgreesInfo && (
        <div className=" px-spacing-4xl pb-spacing-4xl">
          <div className=" relative flex gap-spacing-lg items-start bg-bg-gray-soft-primary border border-border-gray-primary p-spacing-2xl rounded-3xl">
            <div className=" mt-spacing-3xs">
              <Info className=" size-5 text-fg-brand-secondary" />
            </div>
            <div className=" space-y-spacing-2xl">
              <div className=" space-y-spacing-2xs">
                <p className=" text-label-md font-label-md-strong! text-text-gray-primary">
                  {completionProgress}% Profile Complete
                </p>
                <p className=" text-label-md text-text-gray-tertiary">
                  You’re eligible for verification now. Complete more details
                  first if you want to build greater trust.
                </p>
              </div>
              <div className=" flex gap-spacing-sm items-center">
                <span
                  onClick={handleEdit}
                  className=" text-label-sm font-label-sm-strong! text-text-brand-secondary cursor-pointer"
                >
                  Complete Profile
                </span>
                <span
                  onClick={() => setShowProgreesInfo(false)}
                  className=" text-label-sm font-label-sm-strong! text-text-gray-secondary cursor-pointer"
                >
                  Dismiss
                </span>
              </div>
            </div>
            <span
              onClick={() => setShowProgreesInfo(false)}
              className=" absolute top-spacing-2xl right-spacing-2xl cursor-pointer"
            >
              <X className=" size-5 text-fg-gray-tertiary" />
            </span>
          </div>
        </div>
      )}
      <div className="px-spacing-4xl pb-spacing-4xl">
        {isEditMode ? (
          <EditProfile
            existingIndustries={jobProfileDetails?.industry ?? []}
            existingWorkModes={jobProfileDetails?.workMode ?? []}
            register={register}
            control={control}
            errors={errors}
            existingJobTitles={jobProfileDetails?.jobTitle ?? []}
          />
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full gap-spacing-4xl"
          >
            <TabsList className="w-full bg-bg-gray-soft-secondary h-11 justify-start">
              {visibleTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="px-spacing-lg text-label-md font-label-md-strong! 
                          data-[state=active]:shadow-sm 
                          flex-0 
                          data-[state=active]:bg-bg-gray-soft-primary 
                          text-text-gray-quaternary 
                          dark:data-[state=active]:text-text-gray-secondary"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {visibleTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {tab.component}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      <AlertDialog
        open={showOpenToWorkAlert}
        onOpenChange={setShowOpenToWorkAlert}
      >
        <AlertDialogContent className="bg-white min-w-[400px] max-w-[400px]! rounded-3xl border border-others-brand-light gap-spacing-5xl">
          <AlertDialogHeader className=" gap-spacing-2xl">
            <div className=" flex justify-center items-center rounded-xl w-12 h-12 min-w-12 min-h-12 bg-others-brand-brand-zero border border-others-brand-light">
              <CircleQuestionMark className="text-others-brand-dark" />
            </div>
            <div className="space-y-spacing-2xl">
              <AlertDialogTitle className="text-label-lg! font-label-lg-strong! text-text-gray-primary">
                Are you sure you want to make your profile private?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-body-sm text-text-gray-tertiary">
                Making your profile private will make it unavailable to
                recruiters.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-spacing-2xl">
            <AlertDialogCancel
              disabled={isPending}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-secondary"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={async () => {
                await updateJobProfile({
                  id: jobProfileDetails._id,
                  payload: {
                    visibility: VISIBILITY.PRIVATE,
                  },
                  onSuccessCallback: (newData) => {
                    setJobProfileDetails((prev) => ({ ...prev, ...newData }));
                  },
                });
              }}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-white bg-bg-brand-solid-primary"
            >
              {isPending ? 'Saving...' : 'Yes, Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

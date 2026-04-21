'use client';
import Image from 'next/image';
import React, { useCallback, useMemo, useState } from 'react';
import RecruitProfileDefault from '@/public/images/recruit_profile_default.svg';
import RecruitDefaultLogo from '@/public/images/recruit_default_logo.png';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import About from './about';
import EditProfile from './edit-profile';
import { Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  JobProfile,
  JobProfileUpdateInput,
} from '@/services/job-profile/job-profile.type';
import { updateJobProfileSchema } from '@/services/job-profile/job-profile.validation';
import { useUpdateJobProfile } from '@/services/job-profile/job-profile.client';
import WorkExperience from './work-experience/work-experience';
import EducationQualification from './education-qualification/education-qualification';
import Trainings from './trainings/trainings';
import TakenTests from './taken-tests/taken-tests';
// import Documents from './document/documents';
import Applied from './applied/applied';
import Saved from './saved/saved';
import Documents from './documents/documents';

export default function Profile({
  jobProfileData,
}: {
  jobProfileData: JobProfile;
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  const [jobProfileDetails, setJobProfileDetails] = useState(jobProfileData);

  const { updateJobProfile, isPending } = useUpdateJobProfile();
  const methods = useForm<JobProfileUpdateInput>({
    resolver: yupResolver(
      updateJobProfileSchema,
    ) as Resolver<JobProfileUpdateInput>,
    defaultValues: {
      name: jobProfileDetails?.name || '',
      headline: jobProfileDetails?.headline || '',
      email: jobProfileDetails?.email || '',
      contactNumber: jobProfileDetails?.contactNumber || '',
      address: jobProfileDetails?.address || '',
      summary: jobProfileDetails?.summary || '',
      skills: jobProfileDetails?.skills || '',
      interests: jobProfileDetails?.interests || '',
      portfolioUrl: jobProfileDetails?.portfolioUrl || '',
      keywords: jobProfileDetails?.keywords || [],
      languages: jobProfileDetails?.languages || [],
    },
    mode: 'onSubmit',
  });

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
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
      component: <Saved />,
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

  return (
    <div>
      <header className=" p-spacing-4xl rounded-2xl">
        <div className=" h-[244px] relative">
          <Image
            className="max-h-[244px] rounded-3xl w-full object-cover h-full"
            alt="Recruit Profile Default"
            src={RecruitProfileDefault}
            height={244}
          />

          <div className=" w-40 h-40 absolute -bottom-[100px] left-0">
            <Image
              className="max-h-40 max-w-40 w-40 h-40 rounded-full "
              alt="Logo"
              src={RecruitDefaultLogo}
              width={160}
              height={160}
            />
          </div>
        </div>
        <div className=" pl-44 flex justify-between items-center gap-4 py-spacing-xl">
          <div className=" space-y-spacing-2xs">
            <h4 className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
              {jobProfileDetails?.name || 'N/A'}
            </h4>
            <p className=" text-body-sm text-text-gray-tertiary">
              {jobProfileDetails?.headline || 'N/A'}
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

          <div className="flex gap-2">
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
        </div>
      </header>
      <div className="px-spacing-4xl pb-spacing-4xl">
        {isEditMode ? (
          <EditProfile register={register} control={control} errors={errors} />
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
    </div>
  );
}

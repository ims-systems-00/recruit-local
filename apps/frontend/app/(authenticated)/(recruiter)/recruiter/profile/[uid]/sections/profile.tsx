'use client';
import Image from 'next/image';
import React, { useCallback, useMemo, useState } from 'react';
import RecruitProfileDefault from '@/public/images/recruit_profile_default.svg';
import RecruitDefaultLogo from '@/public/images/recruit_default_logo.png';
import { Button } from '@/components/ui/button';
import {
  Camera,
  CircleQuestionMark,
  Globe,
  Info,
  Linkedin,
  X,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import About from './about';
import ServicesAndProducts from './services-and-products';
import Achievements from './achievements';
import CurrentRecruitment from './current-recruitment';
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

import Saves from './saves';
import Activities from './activities';
import { TenantData } from '@/services/tenants/tenants.type';
import EditProfile from './edit-profile';
import { useUpdateTenant } from '@/services/tenants/tenants.client';
import { useComboboxAnchor } from '@/components/ui/combobox';
import { Resolver, useForm } from 'react-hook-form';
import {
  TenantUpdateInput,
  tenantUpdateSchema,
} from '@/services/tenants/tenants.validation';
import { yupResolver } from '@hookform/resolvers/yup';
import { TENANT_TYPE } from '@rl/types';
import Link from 'next/link';
import EditServicesAndProducts from './edit-services-and-products';
import Values from './values/values';
import Jobs from '../../../jobs/sections/jobs';
import { cn } from '@/lib/utils';
import FileUploader from '@/components/file-uploader';
import { Switch } from '@/components/ui/switch';

export default function Profile({ tenantData }: { tenantData: TenantData }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  const [tenantDetails, setTenantDetails] = useState(tenantData);

  const [showProgreesInfo, setShowProgreesInfo] = useState(true);

  const [showRecruitmentAlert, setShowRecruitmentAlert] = useState(false);

  console.log('tenantDetails', tenantDetails);

  const { updateTenant, isPending } = useUpdateTenant();

  const methods = useForm<TenantUpdateInput>({
    resolver: yupResolver(tenantUpdateSchema) as Resolver<TenantUpdateInput>,
    defaultValues: {
      name: tenantDetails?.name || '',
      email: tenantDetails?.email,
      description: tenantDetails?.description,
      phone: tenantDetails?.phone,
      officeAddress: tenantDetails?.officeAddress,
      type: tenantDetails?.type
        ? (tenantDetails?.type as TENANT_TYPE)
        : undefined,
      size: tenantDetails?.size,
      website: tenantDetails?.website,
      linkedIn: tenantDetails?.linkedIn,
      industry: tenantDetails?.industry,
      missionStatement: tenantDetails?.missionStatement,
      visionStatement: tenantDetails?.visionStatement,
      coreProducts: tenantDetails?.coreProducts,
      coreServices: tenantDetails?.coreServices,
      profileImageStorage: tenantDetails?.profileImage?.storageInformation,
      coverPhotoStorage: tenantDetails?.coverPhoto?.storageInformation,
      isRecruitmentEnabled: tenantDetails?.isRecruitmentEnabled,
    },
    mode: 'onSubmit',
  });

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
  } = methods;

  const onSubmit = async (data: TenantUpdateInput) => {
    const payload = {
      ...data,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    await updateTenant({
      id: tenantDetails._id,
      data: cleanPayload,
      onSuccessNext: (newData) => {
        setTenantDetails((prev) => ({ ...prev, ...newData }));
        setIsEditMode(false);
        setActiveTab('about');
      },
    });
  };

  const tabs = [
    {
      value: 'about',
      label: 'About',
      component: (
        // isEditMode ? (
        //   <EditProfile register={register} control={control} errors={errors} />
        // ) : (
        <About profile={tenantDetails} />
      ),
      // ),
      // editable: true,
    },
    // {
    //   value: 'services-and-products',
    //   label: 'Services and Products',
    //   component: isEditMode ? (
    //     <EditServicesAndProducts
    //       register={register}
    //       control={control}
    //       errors={errors}
    //     />
    //   ) : (
    //     <ServicesAndProducts profile={tenantDetails} />
    //   ),
    //   editable: true,
    // },
    {
      value: 'values',
      label: 'Values',
      component: <Values profile={tenantDetails} />,
    },
    // {
    //   value: 'achievements',
    //   label: 'Achievements',
    //   component: <Achievements />,
    // },
    // {
    //   value: 'current-recruitment',
    //   label: 'Current Recruitment',
    //   component: <CurrentRecruitment />,
    // },
    {
      value: 'jobs',
      label: 'Jobs',
      component: (
        <Jobs title="Jobs" description="Create and view Your all jobs" />
      ),
    },
    {
      value: 'activities',
      label: 'Activities',
      component: <Activities />,
    },
    {
      value: 'saves',
      label: 'Saves',
      component: <Saves />,
    },
  ];

  // const visibleTabs = useMemo(() => {
  //   if (!isEditMode) return tabs;
  //   return tabs.filter((tab) => tab.editable);
  // }, [isEditMode, tabs]);

  const visibleTabs = tabs;

  const handleEdit = useCallback(() => {
    setIsEditMode(true);
    setActiveTab('about');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setActiveTab('about');
  }, []);

  const completionProgress = tenantDetails?.completion?.percentage || 0; // 0-100

  const size = 160;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - completionProgress / 100);

  return (
    <div>
      <header className=" p-spacing-4xl rounded-2xl">
        <div className=" h-[244px] relative">
          <div>
            <Image
              className="max-h-[244px] rounded-3xl w-full object-cover h-full"
              alt="Recruit Profile Default"
              src={tenantDetails?.coverPhoto?.src || RecruitProfileDefault}
              height={244}
              width={1900}
            />
            {isEditMode && (
              <FileUploader
                onUpload={async (files) => {
                  await updateTenant({
                    id: tenantDetails._id,
                    data: {
                      name: tenantDetails?.name,
                      coverPhotoStorage: files[0],
                    },
                    onSuccessNext: (newData) => {
                      console.log('newData', newData);

                      setTenantDetails((prev) => ({ ...prev, ...newData }));
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
                    await updateTenant({
                      id: tenantDetails._id,
                      data: {
                        name: tenantDetails?.name,
                        profileImageStorage: files[0],
                      },
                      onSuccessNext: (newData) => {
                        setTenantDetails((prev) => ({ ...prev, ...newData }));
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
                src={tenantDetails?.profileImage?.src || RecruitDefaultLogo}
                width={160}
                height={160}
              />
            </div>
          </div>
        </div>
        <div className=" pl-44 flex justify-between items-center gap-4 py-spacing-xl">
          <div className=" space-y-spacing-sm">
            <h4 className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
              {tenantDetails?.name}
            </h4>
            <div className=" flex items-center gap-spacing-xs">
              {tenantDetails?.linkedIn && (
                <Link
                  href={tenantDetails.linkedIn}
                  target="_blank"
                  className=" h-9 w-9 border border-border-gray-secondary rounded-sm flex justify-center items-center"
                >
                  <Linkedin className=" text-fg-gray-secondary size-4" />
                </Link>
              )}
              {tenantDetails?.website && (
                <Link
                  href={tenantDetails.website}
                  target="_blank"
                  className=" h-9 w-9 border border-border-gray-secondary rounded-sm flex justify-center items-center"
                >
                  <Globe className=" text-fg-gray-secondary size-4" />
                </Link>
              )}
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
                  Recruitment
                </span>

                <Switch
                  checked={tenantDetails?.isRecruitmentEnabled}
                  disabled={isPending}
                  onCheckedChange={async (v) => {
                    if (v) {
                      await updateTenant({
                        id: tenantDetails._id,
                        data: {
                          name: tenantDetails?.name,
                          isRecruitmentEnabled: true,
                        },
                        onSuccessNext: (newData) => {
                          setTenantDetails((prev) => ({ ...prev, ...newData }));
                        },
                      });
                      return;
                    }

                    setShowRecruitmentAlert(true);
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
          <EditProfile register={register} control={control} errors={errors} />
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full gap-spacing-4xl"
          >
            <TabsList className="w-full bg-bg-gray-soft-secondary h-11 justify-start overflow-x-auto">
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
        open={showRecruitmentAlert}
        onOpenChange={setShowRecruitmentAlert}
      >
        <AlertDialogContent className="bg-white min-w-[400px] max-w-[400px]! rounded-3xl border border-others-brand-light gap-spacing-5xl">
          <AlertDialogHeader className=" gap-spacing-2xl">
            <div className=" flex justify-center items-center rounded-xl w-12 h-12 min-w-12 min-h-12 bg-others-brand-brand-zero border border-others-brand-light">
              <CircleQuestionMark className="text-others-brand-dark" />
            </div>
            <div className="space-y-spacing-2xl">
              <AlertDialogTitle className="text-label-lg! font-label-lg-strong! text-text-gray-primary">
                Are you sure you want to turn off all recruitment?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-body-sm text-text-gray-tertiary">
                Turning off recruitment will make all your active recruitment
                listings unavailable to candidates.
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
              // onClick={() => softDeleteCv(cv._id)}
              onClick={async () => {
                await updateTenant({
                  id: tenantDetails._id,
                  data: {
                    name: tenantDetails?.name,
                    isRecruitmentEnabled: false,
                  },
                  onSuccessNext: (newData) => {
                    setTenantDetails((prev) => ({ ...prev, ...newData }));
                  },
                });
              }}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-white bg-bg-brand-solid-primary"
            >
              {isPending ? 'Deleting...' : 'Yes, Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

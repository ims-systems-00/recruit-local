'use client';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RecruitProfileDefault from '@/public/images/recruit_profile_default.svg';
import RecruitDefaultLogo from '@/public/images/recruit_default_logo.png';
import { Button } from '@/components/ui/button';
import {
  Camera,
  CircleQuestionMark,
  Globe,
  Info,
  Linkedin,
  ShieldCheck,
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
import EditProfile, {
  ORG_TYPE_OPTIONS,
  TENANT_INDUSTRY_OPTIONS,
} from './edit-profile';
import { useUpdateTenant } from '@/services/tenants/tenants.client';
import { useComboboxAnchor } from '@/components/ui/combobox';
import { Resolver, UseFormSetValue, useForm } from 'react-hook-form';
import {
  TenantUpdateInput,
  tenantUpdateSchema,
} from '@/services/tenants/tenants.validation';
import { yupResolver } from '@hookform/resolvers/yup';
import { TENANT_TYPE } from '@rl/types';
import { useSession } from 'next-auth/react';
import { isValidPhoneNumber } from 'libphonenumber-js';
import {
  usePageAction,
  usePageContext,
} from '@/components/ai-chat/page-context';
import { excerpt } from '@/components/ai-chat/page-state';
import { AGENT_STAGGER_MS, prefersReducedMotion, wait } from '@/lib/motion';
import Link from 'next/link';
import EditServicesAndProducts from './edit-services-and-products';
import Values from './values/values';
import Jobs from '../../../jobs/sections/jobs';
import { cn } from '@/lib/utils';
import FileUploader from '@/components/file-uploader';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';

/**
 * The dropdown values, read off the same arrays the selects render from, so the
 * options Alice is offered cannot drift from the options on screen.
 *
 * These two lists are plain frontend constants, not rows in a catalog
 * collection — unlike a candidate's job titles or industries, there is nothing
 * for `search_catalog` to look up, so the allowed values are handed to Alice in
 * the page state instead.
 */
const ORG_TYPE_VALUES = ORG_TYPE_OPTIONS.map((option) => option.value);
const TENANT_INDUSTRY_VALUES = TENANT_INDUSTRY_OPTIONS.map(
  (option) => option.value,
);

/**
 * The free-text fields Alice may fill in on the organisation form, with the
 * limits she must respect.
 *
 * The caps mirror the form's own yup schema where it has one (`name`) and are
 * otherwise a sanity bound — the point is to reject a runaway value before it
 * lands in an input the recruiter then has to clear by hand.
 *
 * Logos, the cover photo and the recruitment switch are deliberately absent:
 * the first two are file uploads, and the switch takes every live job listing
 * away from candidates and has its own confirmation dialog for that reason.
 */
const FILLABLE_TEXT_FIELDS = [
  { key: 'name', label: 'organisation name', max: 50 },
  { key: 'description', label: 'description', max: 2000 },
  { key: 'email', label: 'contact email', max: 254 },
  { key: 'officeAddress', label: 'office address', max: 200 },
  { key: 'website', label: 'website', max: 300 },
  { key: 'linkedIn', label: 'LinkedIn URL', max: 300 },
] as const;

const URL_PATTERN = /^https?:\/\/\S+$/i;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

/**
 * Validates everything Alice sent, and returns one setter per accepted field.
 *
 * Nothing is written while validating: a bad fourth field would otherwise leave
 * the first three already in the form, with Alice reporting an error for a
 * change the recruiter can see on screen. Returning closures also keeps the
 * order the form reads in, which is the order they are revealed.
 *
 * Throws rather than dropping a bad field — the message is shown to the user,
 * and a silent drop would have Alice claiming she filled in something that
 * never appeared.
 */
const buildFieldUpdates = (
  args: Record<string, unknown>,
  setValue: UseFormSetValue<TenantUpdateInput>,
) => {
  const text = (key: (typeof FILLABLE_TEXT_FIELDS)[number]['key']) => {
    const field = FILLABLE_TEXT_FIELDS.find((item) => item.key === key)!;
    const raw = args[key];
    if (raw === undefined || raw === null) return null;

    if (typeof raw !== 'string') {
      throw new Error(
        `Alice's ${field.label} wasn't usable. Ask her to try again.`,
      );
    }

    const value = raw.trim();
    if (!value) return null;

    if (value.length > field.max) {
      throw new Error(
        `Alice's ${field.label} is too long — the limit is ${field.max} characters.`,
      );
    }

    if ((key === 'website' || key === 'linkedIn') && !URL_PATTERN.test(value)) {
      throw new Error(
        `Alice's ${field.label} wasn't a full web address. Ask her to try again.`,
      );
    }

    if (key === 'email' && !EMAIL_PATTERN.test(value)) {
      throw new Error(
        "Alice's contact email wasn't a valid address. Ask her to try again.",
      );
    }

    return {
      label: field.label,
      apply: () =>
        setValue(key, value, { shouldDirty: true, shouldTouch: true }),
    };
  };

  // Built in the order the form reads down the page, so the reveal follows the
  // fields the recruiter is looking at rather than the order Alice sent them.
  const updates: { label: string; apply: () => void }[] = [];
  const push = (update: { label: string; apply: () => void } | null) => {
    if (update) updates.push(update);
  };

  push(text('name'));

  if (args.type !== undefined && args.type !== null) {
    const value = String(args.type).trim();
    if (!ORG_TYPE_VALUES.includes(value as TENANT_TYPE)) {
      throw new Error(
        `"${value}" isn't an organisation type on this form. Ask Alice to try again.`,
      );
    }
    updates.push({
      label: 'organisation type',
      apply: () =>
        setValue('type', value as TENANT_TYPE, {
          shouldDirty: true,
          shouldTouch: true,
        }),
    });
  }

  if (args.size !== undefined && args.size !== null) {
    const value = Number(args.size);
    if (!Number.isInteger(value) || value < 1 || value > 1_000_000) {
      throw new Error(
        "Alice's number of employees wasn't a whole number. Ask her to try again.",
      );
    }
    updates.push({
      label: 'number of employees',
      apply: () =>
        setValue('size', value, { shouldDirty: true, shouldTouch: true }),
    });
  }

  if (args.industry !== undefined && args.industry !== null) {
    const value = String(args.industry).trim();
    if (!TENANT_INDUSTRY_VALUES.includes(value as never)) {
      throw new Error(
        `"${value}" isn't an industry on this form. Ask Alice to try again.`,
      );
    }
    updates.push({
      label: 'industry',
      apply: () =>
        setValue('industry', value, { shouldDirty: true, shouldTouch: true }),
    });
  }

  push(text('description'));
  push(text('email'));

  if (args.phone !== undefined && args.phone !== null) {
    const value = String(args.phone).trim();
    if (!isValidPhoneNumber(value)) {
      throw new Error(
        "Alice's contact number wasn't a valid phone number. Ask her for it in international format, e.g. +44 20 7946 0958.",
      );
    }
    updates.push({
      label: 'contact number',
      apply: () =>
        setValue('phone', value, { shouldDirty: true, shouldTouch: true }),
    });
  }

  push(text('officeAddress'));
  push(text('website'));
  push(text('linkedIn'));

  return updates;
};

export default function Profile({ tenantData }: { tenantData: TenantData }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  const router = useRouter();

  const { data: session } = useSession();

  const [tenantDetails, setTenantDetails] = useState(tenantData);

  const [showProgreesInfo, setShowProgreesInfo] = useState(true);

  const [showRecruitmentAlert, setShowRecruitmentAlert] = useState(false);

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
    reset,
    watch,
    setValue,
  } = methods;

  useEffect(() => {
    reset({
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
    });
  }, [
    tenantDetails?.profileImage?.storageInformation,
    tenantDetails?.coverPhoto?.storageInformation,
  ]);

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
        <Jobs title="Jobs" description="Create and View all your Jobs" />
      ),
    },
    {
      value: 'activities',
      label: 'Activities',
      component: <Activities />,
    },
    {
      value: 'saves',
      label: 'Saved',
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

  /**
   * This route loads any tenant by id, so it renders other organisations'
   * profiles as well as the viewer's own. Alice is told which she is looking at,
   * and the actions below are registered only on the recruiter's own — offering
   * to edit a competitor's profile would be a confusing thing to offer and a
   * failed request if taken up.
   *
   * It decides what Alice is told, not what anyone may do: every save behind
   * these fields is still authorized on the server.
   */
  const isOwnOrganisation = Boolean(
    session?.user?.tenantId && session.user.tenantId === tenantDetails?._id,
  );

  /**
   * One context covering both modes, because both live in this component.
   *
   * The text fields go in as excerpts, not in full: the server caps a page
   * state at 2,000 serialized characters and rejects the whole request over it,
   * and a filled-in description and office address together can pass that on
   * their own. Knowing whether a field is filled and roughly what it says is
   * what Alice needs it for, and `length` carries the rest.
   */
  usePageContext(
    isEditMode
      ? {
          page: 'recruiter.profile.edit',
          summary:
            "The recruiter's own organisation profile, with the edit form open. They press " +
            'Save to store any changes, or Cancel to discard them.',
          state: {
            editing: true,
            name: excerpt(watch('name')),
            type: watch('type') ?? null,
            size: watch('size') ?? null,
            industry: watch('industry') ?? null,
            description: excerpt(watch('description')),
            email: excerpt(watch('email')),
            phone: excerpt(watch('phone')),
            officeAddress: excerpt(watch('officeAddress')),
            website: excerpt(watch('website')),
            linkedIn: excerpt(watch('linkedIn')),
            // No catalog backs these two, so the allowed values ship with the
            // page rather than being searched for.
            options: {
              type: ORG_TYPE_VALUES,
              industry: TENANT_INDUSTRY_VALUES,
            },
          },
        }
      : {
          page: 'recruiter.profile',
          summary: isOwnOrganisation
            ? 'The recruiter\'s own organisation profile, in read mode. Pressing "Edit Profile" ' +
              'opens a form covering its name, type, size, industry, description, contact email, ' +
              'phone, office address, website and LinkedIn.'
            : "Another organisation's profile, as the user is viewing it. They cannot change " +
              'anything here.',
          state: {
            ownOrganisation: isOwnOrganisation,
            editing: false,
            organisation: tenantDetails?.name ?? null,
            completion: completionProgress,
          },
        },
  );

  /**
   * Opening the editor is a UI toggle, not a write: it renders the form Alice
   * can then fill. Without it she can only tell the recruiter to press the
   * button themselves, which is the same click with an extra step.
   */
  usePageAction({
    enabled: isOwnOrganisation && !isEditMode,
    name: 'open_profile_editor',
    description:
      "Open the edit form on the organisation's profile page, so its fields can be filled in. " +
      'Call this when the user asks to change something about their organisation and the form ' +
      'is not open yet. It only reveals the form; it changes and saves nothing.',
    parameters: { type: 'object', properties: {} },
    handler: () => {
      handleEdit();
      return 'Opened the organisation profile editor.';
    },
  });

  usePageAction({
    enabled: isOwnOrganisation && isEditMode,
    name: 'fill_organisation_fields',
    description:
      'Fill in the fields on the open organisation profile form: name, type, number of ' +
      'employees, industry, description, contact email, phone, office address, website or ' +
      'LinkedIn. Pass only the fields being changed — anything left out keeps its current ' +
      'value. Use what the user told you about their organisation; do not invent details ' +
      'about it, and do not infer its industry or size from its name. This does not save; ' +
      'the user presses Save.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "The organisation's name, up to 50 characters.",
        },
        type: {
          type: 'string',
          enum: [...ORG_TYPE_VALUES],
          description: 'Whether the organisation is private or public.',
        },
        size: {
          type: 'number',
          description: 'Number of employees, as a whole number.',
        },
        industry: {
          type: 'string',
          enum: [...TENANT_INDUSTRY_VALUES],
          description: 'The industry the organisation operates in.',
        },
        description: {
          type: 'string',
          description:
            "A description of the organisation, in the recruiter's words.",
        },
        email: {
          type: 'string',
          description: "The organisation's contact email address.",
        },
        phone: {
          type: 'string',
          description:
            'Contact number in international format, e.g. +44 20 7946 0958.',
        },
        officeAddress: {
          type: 'string',
          description: 'The office address, or the city and country.',
        },
        website: {
          type: 'string',
          description: 'Full URL including https://.',
        },
        linkedIn: {
          type: 'string',
          description: 'Full LinkedIn company page URL including https://.',
        },
      },
    },
    handler: async (args) => {
      const updates = buildFieldUpdates(args, setValue);

      if (updates.length === 0) {
        throw new Error(
          "Alice didn't send anything to fill in. Try asking again.",
        );
      }

      for (const [index, update] of updates.entries()) {
        update.apply();
        if (index < updates.length - 1 && !prefersReducedMotion()) {
          await wait(AGENT_STAGGER_MS);
        }
      }

      return `Filled in ${updates.map((update) => update.label).join(', ')}.`;
    },
  });

  return (
    <div>
      <header className=" p-spacing-4xl rounded-2xl">
        <div className=" h-40 sm:h-[244px] relative">
          <div>
            <Image
              className="max-h-40 sm:max-h-[244px] min-h-40 sm:min-h-[244px] rounded-3xl w-full object-cover h-full"
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
        <div className=" pt-30 sm:pl-44 sm:pt-spacing-xl flex justify-between items-center gap-4 pb-spacing-xl">
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
                <div className=" flex flex-col sm:flex-row items-center gap-spacing-2xl">
                  {!tenantDetails?.kycStatus && (
                    <Button
                      onClick={() => {
                        router.push(
                          `/recruiter/profile/${tenantDetails._id}/verification`,
                        );
                      }}
                      className=" flex items-center justify-center gap-spacing-2xs cursor-pointer bg-bg-brand-solid-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-white"
                    >
                      <span>
                        <ShieldCheck className=" size-5" />
                      </span>
                      Apply for Verification
                    </Button>
                  )}

                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
                  >
                    Edit Profile
                  </Button>
                </div>
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
                  You’re now eligible for verification. Complete your profile if
                  you wish to build greater trust
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
              {isPending ? 'Saving...' : 'Yes, Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

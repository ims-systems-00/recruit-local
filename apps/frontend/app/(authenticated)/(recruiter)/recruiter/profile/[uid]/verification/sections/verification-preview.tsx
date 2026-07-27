import { UploadedFile } from '@/components/attachment-form';
import AttachmentItem from '@/components/attachment-item';
import { cn } from '@/lib/utils';
import { KycData } from '@/services/kyc/kyc.type';
import { KYC_DOCUMENT_TYPE, KYC_STATUS } from '@rl/types';
import React from 'react';

const KYC_STATUS_CONFIG = {
  [KYC_STATUS.UNVERIFIED]: {
    text: 'Unverified',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-500',
  },
  [KYC_STATUS.PENDING]: {
    text: 'Pending',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
  },
  [KYC_STATUS.VERIFIED]: {
    text: 'Verified',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-500',
  },
  [KYC_STATUS.REJECTED]: {
    text: 'Rejected',
    textColor: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
  },
  [KYC_STATUS.ACTION_REQUIRED]: {
    text: 'Action Required',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-500',
  },
} satisfies Record<
  KYC_STATUS,
  {
    text: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
  }
>;

const documentTypeLabels = {
  [KYC_DOCUMENT_TYPE.NATIONAL_INSURANCE_NUMBER]: 'National Insurance Number',
  [KYC_DOCUMENT_TYPE.DRIVER_LICENSE]: 'Driving License',
  [KYC_DOCUMENT_TYPE.ID_CARD]: 'National ID Card',
  [KYC_DOCUMENT_TYPE.PASSPORT]: 'Passport',
};

export default function VerificationPreview({ kycData }: { kycData: KycData }) {
  return (
    <div className=" p-spacing-4xl space-y-spacing-4xl">
      <div className="flex justify-between items-center">
        <div className=" space-y-spacing-2xs">
          <h3 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Profile Verification
          </h3>
          <p className=" capitalize text-label-sm text-text-gray-tertiary">
            Make Strong bond by verifying your Account
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border-gray-secondary p-spacing-4xl flex flex-col gap-spacing-4xl">
        <div className="space-y-spacing-lg">
          <p className="text-label-md font-label-md-strong! text-text-gray-primary">
            Verification Status
          </p>
          <span
            className={cn(
              'text-label-sm font-label-sm-strong! px-spacing-md py-spacing-3xs rounded-md inline-flex items-center justify-center border',
              KYC_STATUS_CONFIG[kycData.status as KYC_STATUS].textColor,
              KYC_STATUS_CONFIG[kycData.status as KYC_STATUS].bgColor,
              KYC_STATUS_CONFIG[kycData.status as KYC_STATUS].borderColor,
            )}
          >
            {KYC_STATUS_CONFIG[kycData.status as KYC_STATUS].text || 'N/A'}
          </span>
        </div>
      </div>
      <div className="space-y-spacing-xs">
        <p className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
          {documentTypeLabels[kycData.documentType]}
        </p>

        {kycData.documentType ===
        KYC_DOCUMENT_TYPE.NATIONAL_INSURANCE_NUMBER ? (
          <div className="rounded-2xl border border-border-gray-secondary p-spacing-4xl flex flex-col gap-spacing-4xl">
            <div className="space-y-spacing-lg">
              <p className="text-label-md font-label-md-strong! text-text-gray-primary">
                {kycData.nationalInsuranceNumber}
              </p>
            </div>
          </div>
        ) : (
          kycData.documentFront?.storageInformation?.Key &&
          kycData.documentBack?.storageInformation?.Key && (
            <div className=" space-y-spacing-lg">
              <AttachmentItem
                isViewing
                key={kycData.documentFront?.storageInformation?.Key}
                isDeleting={false}
                item={kycData.documentFront?.storageInformation as UploadedFile}
                onDelete={(item) => {}}
              />
              <AttachmentItem
                key={kycData.documentBack?.storageInformation?.Key}
                isDeleting={false}
                item={kycData.documentBack?.storageInformation as UploadedFile}
                onDelete={(item) => {}}
                isViewing
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

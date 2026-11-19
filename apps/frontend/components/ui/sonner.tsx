'use client';

import type * as React from 'react';
import { Check, Loader2Icon, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { cn } from '@/lib/utils';

function ToastInfoIcon() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-others-blue-xlight">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-5"
        aria-hidden="true"
      >
        <path
          d="M12 3.25 19.75 7.75 12 12.25 4.25 7.75Z"
          className="fill-bg-white stroke-others-blue-default"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M4.25 7.75 12 12.25V20.75L4.25 16.25Z"
          className="fill-others-blue-default stroke-others-blue-default"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M19.75 7.75 12 12.25V20.75L19.75 16.25Z"
          className="fill-others-blue-default stroke-others-blue-default"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8.1 5.5 15.9 10"
          className="stroke-others-blue-default"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12 12.25V20.5"
          className="stroke-fg-white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function ToastWarningIcon() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-others-warning-xlight">
      <span className="flex size-5 items-center justify-center rounded-full bg-others-warning-default text-fg-white">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="size-3.5"
          aria-hidden="true"
        >
          <circle cx="8" cy="4.5" r="1.15" fill="currentColor" />
          <path
            d="M8 7.25V12"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  );
}

const defaultToastIcons: NonNullable<ToasterProps['icons']> = {
  success: (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-others-success-xlight">
      <span className="flex size-5 items-center justify-center rounded-full bg-others-success-default text-fg-white">
        <Check className="size-3 stroke-[3]" />
      </span>
    </span>
  ),
  error: (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-others-error-xlight">
      <span className="flex size-5 items-center justify-center rounded-full bg-others-error-default text-fg-white">
        <X className="size-3 stroke-[3]" />
      </span>
    </span>
  ),
  warning: <ToastWarningIcon />,
  info: <ToastInfoIcon />,
  loading: (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-gray-soft-tertiary">
      <Loader2Icon className="size-5 animate-spin text-fg-gray-secondary" />
    </span>
  ),
  close: <X className="size-4 stroke-[1.75]" />,
};

const defaultToastClassNames: NonNullable<
  NonNullable<ToasterProps['toastOptions']>['classNames']
> = {
  toast:
    'group/toast relative flex w-full items-center gap-spacing-xl rounded-2xl border border-border-gray-secondary/60 bg-bg-gray-soft-primary p-spacing-xl shadow-lg data-[expanded=false]:data-[front=false]:*:opacity-0',
  icon: 'relative flex size-10 shrink-0 items-center justify-center',
  content: 'flex min-w-0 flex-1 flex-col gap-spacing-2xs',
  title: 'text-label-sm font-label-sm-strong! text-text-gray-primary',
  description: 'text-label-sm text-text-gray-tertiary',
  closeButton:
    'order-last ml-auto flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-gray-tertiary transition-colors hover:bg-bg-gray-soft-tertiary hover:text-fg-gray-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-brand-primary group-has-data-[description]/toast:self-start',
  actionButton:
    'shrink-0 cursor-pointer rounded-lg bg-bg-brand-solid-primary px-spacing-lg py-spacing-xs text-label-xs font-label-xs-strong! text-text-white transition-colors hover:bg-bg-brand-solid-secondary',
  cancelButton:
    'shrink-0 cursor-pointer rounded-lg border border-border-gray-primary bg-bg-gray-soft-primary px-spacing-lg py-spacing-xs text-label-xs font-label-xs-strong! text-text-gray-secondary transition-colors hover:bg-bg-gray-soft-secondary',
};

const Toaster = ({
  className,
  closeButton = true,
  icons,
  style,
  toastOptions,
  ...props
}: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      closeButton={closeButton}
      className={cn('toaster group', className)}
      icons={{
        ...defaultToastIcons,
        ...icons,
      }}
      toastOptions={{
        unstyled: true,
        ...toastOptions,
        classNames: {
          ...defaultToastClassNames,
          ...toastOptions?.classNames,
        },
      }}
      style={
        {
          '--width': '380px',
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };

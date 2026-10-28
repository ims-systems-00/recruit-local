'use client';
import React from 'react';
import { Button } from '@/components/ui/button';

import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { useCreateTanent } from '@/services/tenants/tenants.client';
import { useLogout } from '@/services/auth/auth.client';
import {
  usePageAction,
  usePageContext,
} from '@/components/ai-chat/page-context';
import { excerpt } from '@/components/ai-chat/page-state';

/** The server's limit on a tenant name. */
const MAX_NAME_CHARS = 300;

export default function CreateOrganizationForm() {
  const { logout, isLoading: isLoggingOut } = useLogout();
  const {
    register,
    onSubmit,
    isSubmitting,
    formState: { errors, isValid },
    control,
    setValue,
    watch,
  } = useCreateTanent();

  usePageContext({
    page: 'recruiter.onboarding.organization',
    summary:
      'First onboarding step for an employer: name their organisation. ' +
      'The user presses Continue to create it.',
    state: { organisationName: excerpt(watch('name')) },
  });

  // Lets Alice fill the name in. Creating the organisation is still Continue.
  usePageAction({
    name: 'fill_organisation_name',
    description:
      'Fill in the organisation name on this step. Use the name the user gave you; ' +
      "don't invent one. This does not create the organisation; the user presses Continue.",
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: `The organisation name, up to ${MAX_NAME_CHARS} characters.`,
        },
      },
      required: ['name'],
    },
    handler: (args) => {
      const name = typeof args.name === 'string' ? args.name.trim() : '';

      if (!name) {
        throw new Error(
          "Alice didn't send a name to fill in. Try asking again.",
        );
      }
      if (name.length > MAX_NAME_CHARS) {
        throw new Error(
          `That name is too long. ${MAX_NAME_CHARS} characters at most.`,
        );
      }

      setValue('name', name, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      return `Filled in the organisation name: ${name}.`;
    },
  });

  return (
    <form onSubmit={onSubmit} className=" space-y-spacing-4xl w-full">
      <div className="space-y-spacing-xs">
        <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
          Organisation Name
        </Label>
        <div className=" space-y-spacing-3xs">
          <InputGroup className="h-12 rounded-lg shadow-light">
            <InputGroupInput
              type="text"
              placeholder="Enter Organisation name"
              {...register('name')}
            />
          </InputGroup>
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
      </div>
      <div className=" flex justify-end items-center gap-4 pt-3 border-t border-border">
        <Button
          type="button"
          onClick={() => logout()}
          disabled={isLoggingOut || isSubmitting}
          className=" cursor-pointer text-base bg-transparent border border-border text-title rounded-lg h-10 hover:bg-transparent"
        >
          {isLoggingOut ? 'Logging out...' : 'Cancel'}
        </Button>
        <Button
          type="submit"
          disabled={isLoggingOut || isSubmitting}
          className=" cursor-pointer text-base bg-bg-brand-solid-primary border-primary text-white rounded-lg h-10"
        >
          {isSubmitting ? 'Creating...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}

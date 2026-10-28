import { UseFormSetValue } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input';
import {
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  WORKING_DAYS_ENUMS,
  WORKPLACE_ENUMS,
  type AgentPageActionDefDto,
} from '@rl/types';
import { JobInformationFormValues } from '../job.schema';

/**
 * Lets Alice fill in step 1 of the job form. Location is left out: its picker
 * resolves a real address, and a typed one would skip that.
 */
export const FILL_JOB_BASICS_ACTION: AgentPageActionDefDto = {
  name: 'fill_job_basics',
  description:
    'Fill in the basic information on the job form the user has open: title, employment type, ' +
    'workplace, experience, vacancies, pay, working days and hours, application end date, and ' +
    'organisation contact details. Pass only the fields being changed. Use what the user told ' +
    "you; do not invent details. This does not save; the user presses Continue. It can't set " +
    'the location — ask the user to pick it.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Job title.' },
      employmentType: {
        type: 'string',
        enum: Object.values(EMPLOYMENT_TYPE),
      },
      workplace: { type: 'string', enum: Object.values(WORKPLACE_ENUMS) },
      yearOfExperience: {
        type: 'integer',
        description: 'Years of experience required.',
      },
      vacancy: { type: 'integer', description: 'Number of openings.' },
      salary: { type: 'number', description: 'Pay per period.' },
      period: {
        type: 'string',
        enum: Object.values(PERIOD_ENUMS),
        description: 'What the salary is paid per.',
      },
      workingDays: { type: 'integer', description: 'Working days a week.' },
      weekends: {
        type: 'array',
        items: { type: 'string', enum: Object.values(WORKING_DAYS_ENUMS) },
        description: 'Days off. At most 7 minus the working days.',
      },
      startTime: { type: 'string', description: 'Start of day, 24h HH:MM.' },
      endTime: { type: 'string', description: 'End of day, 24h HH:MM.' },
      endDate: {
        type: 'string',
        description: 'Last day to apply, YYYY-MM-DD, not in the past.',
      },
      aboutUs: { type: 'string', description: 'About the organisation.' },
      email: { type: 'string', description: 'Contact email.' },
      number: {
        type: 'string',
        description: 'Contact phone, international format: +447911123456.',
      },
      locationAdditionalInfo: {
        type: 'string',
        description: 'Extra location detail, such as building or floor.',
      },
    },
    additionalProperties: false,
  },
};

const SET_OPTIONS = {
  shouldDirty: true,
  shouldTouch: true,
  shouldValidate: true,
} as const;

/** The schema's own pattern for a working-hours time. */
const TIME_PATTERN = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * One field to fill. Each carries its own setter call, so every path stays
 * typed against the form instead of going through one loosely typed setter.
 */
export interface JobBasicsFill {
  label: string;
  apply: (setValue: UseFormSetValue<JobInformationFormValues>) => void;
}

const unusable = (label: string) =>
  new Error(`Alice's ${label} wasn't usable. Ask her to try again.`);

const isAbsent = (raw: unknown) => raw === undefined || raw === null;

const readText = (raw: unknown, label: string, max: number) => {
  if (isAbsent(raw)) return undefined;
  if (typeof raw !== 'string') throw unusable(label);

  const value = raw.trim();
  if (!value) return undefined;
  if (value.length > max) {
    throw new Error(
      `Alice's ${label} is too long — the limit is ${max} characters.`,
    );
  }

  return value;
};

const readWhole = (raw: unknown, label: string, min: number, max: number) => {
  if (isAbsent(raw)) return undefined;
  if (
    typeof raw !== 'number' ||
    !Number.isInteger(raw) ||
    raw < min ||
    raw > max
  ) {
    throw new Error(
      `Alice's ${label} must be a whole number from ${min} to ${max}.`,
    );
  }

  return raw;
};

const readOption = <T extends string>(
  raw: unknown,
  label: string,
  options: readonly T[],
) => {
  if (isAbsent(raw)) return undefined;
  if (!options.includes(raw as T)) throw unusable(label);

  return raw as T;
};

/** `9:00` and `09:00` both pass the schema; the time input needs the latter. */
const readTime = (raw: unknown, label: string) => {
  const value = readText(raw, label, 5);
  if (value === undefined) return undefined;
  if (!TIME_PATTERN.test(value)) throw unusable(label);

  return value.padStart(5, '0');
};

/** A calendar day in the user's own timezone, as the date picker sets it. */
const readFutureDate = (raw: unknown, label: string) => {
  const value = readText(raw, label, 10);
  if (value === undefined) return undefined;

  const match = DATE_PATTERN.exec(value);
  if (!match) throw unusable(label);

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  // Rejects dates that roll over, such as 2026-02-30.
  if (date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw unusable(label);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    throw new Error(
      `Alice's ${label} is in the past. Ask her for a later one.`,
    );
  }

  return date;
};

/**
 * Validates what Alice sent before any of it reaches the form.
 *
 * Throws rather than dropping a bad field: the message is shown to the user, and
 * a silent drop would leave Alice reporting that she filled in something the
 * user cannot see. `current` is what the form holds now, for the one check that
 * spans fields.
 */
export const parseJobBasics = (
  args: Record<string, unknown>,
  current: { workingDays?: number },
): JobBasicsFill[] => {
  const fills: JobBasicsFill[] = [];

  const title = readText(args.title, 'job title', 200);
  if (title !== undefined) {
    fills.push({
      label: 'job title',
      apply: (set) => set('title', title, SET_OPTIONS),
    });
  }

  const employmentType = readOption(
    args.employmentType,
    'employment type',
    Object.values(EMPLOYMENT_TYPE),
  );
  if (employmentType !== undefined) {
    fills.push({
      label: 'employment type',
      apply: (set) => set('employmentType', employmentType, SET_OPTIONS),
    });
  }

  const workplace = readOption(
    args.workplace,
    'workplace',
    Object.values(WORKPLACE_ENUMS),
  );
  if (workplace !== undefined) {
    fills.push({
      label: 'workplace',
      apply: (set) => set('workplace', workplace, SET_OPTIONS),
    });
  }

  const yearOfExperience = readWhole(
    args.yearOfExperience,
    'years of experience',
    0,
    60,
  );
  if (yearOfExperience !== undefined) {
    fills.push({
      label: 'years of experience',
      apply: (set) => set('yearOfExperience', yearOfExperience, SET_OPTIONS),
    });
  }

  const vacancy = readWhole(args.vacancy, 'number of vacancies', 1, 10000);
  if (vacancy !== undefined) {
    fills.push({
      label: 'number of vacancies',
      apply: (set) => set('vacancy', vacancy, SET_OPTIONS),
    });
  }

  if (!isAbsent(args.salary)) {
    const salary = args.salary;
    if (typeof salary !== 'number' || !Number.isFinite(salary) || salary < 0) {
      throw unusable('salary');
    }
    fills.push({
      label: 'salary',
      apply: (set) => set('salary', salary, SET_OPTIONS),
    });
  }

  const period = readOption(
    args.period,
    'pay period',
    Object.values(PERIOD_ENUMS),
  );
  if (period !== undefined) {
    fills.push({
      label: 'pay period',
      apply: (set) => set('period', period, SET_OPTIONS),
    });
  }

  const workingDays = readWhole(args.workingDays, 'working days', 1, 7);
  if (workingDays !== undefined) {
    fills.push({
      label: 'working days',
      apply: (set) => set('workingDays', workingDays, SET_OPTIONS),
    });
  }

  if (!isAbsent(args.weekends)) {
    if (!Array.isArray(args.weekends)) throw unusable('weekends');

    const weekends = [
      ...new Set(
        args.weekends.map((day) =>
          readOption(day, 'weekends', Object.values(WORKING_DAYS_ENUMS)),
        ),
      ),
    ].filter((day): day is WORKING_DAYS_ENUMS => day !== undefined);

    // The schema's limit, checked here so it fails before anything is filled.
    const days = workingDays ?? current.workingDays;
    if (days && weekends.length > 7 - days) {
      throw new Error(
        `Alice picked ${weekends.length} weekend days, but ${days} working days leave room for ${7 - days}.`,
      );
    }

    fills.push({
      label: 'weekends',
      apply: (set) => set('weekends', weekends, SET_OPTIONS),
    });
  }

  const startTime = readTime(args.startTime, 'start time');
  if (startTime !== undefined) {
    fills.push({
      label: 'start time',
      apply: (set) => set('workingHours.startTime', startTime, SET_OPTIONS),
    });
  }

  const endTime = readTime(args.endTime, 'end time');
  if (endTime !== undefined) {
    fills.push({
      label: 'end time',
      apply: (set) => set('workingHours.endTime', endTime, SET_OPTIONS),
    });
  }

  const endDate = readFutureDate(args.endDate, 'application end date');
  if (endDate !== undefined) {
    fills.push({
      label: 'application end date',
      apply: (set) => set('endDate', endDate, SET_OPTIONS),
    });
  }

  const aboutUs = readText(args.aboutUs, 'about us', 2000);
  if (aboutUs !== undefined) {
    fills.push({
      label: 'about us',
      apply: (set) => set('aboutUs', aboutUs, SET_OPTIONS),
    });
  }

  const email = readText(args.email, 'email', 254);
  if (email !== undefined) {
    if (!EMAIL_PATTERN.test(email)) throw unusable('email');
    fills.push({
      label: 'email',
      apply: (set) => set('email', email, SET_OPTIONS),
    });
  }

  const number = readText(args.number, 'contact number', 30)?.replace(
    /[\s()-]/g,
    '',
  );
  if (number !== undefined) {
    if (!number.startsWith('+') || !isValidPhoneNumber(number)) {
      throw new Error(
        "Alice's contact number isn't a valid international number, such as +447911123456.",
      );
    }
    fills.push({
      label: 'contact number',
      apply: (set) => set('number', number, SET_OPTIONS),
    });
  }

  const locationAdditionalInfo = readText(
    args.locationAdditionalInfo,
    'additional location information',
    200,
  );
  if (locationAdditionalInfo !== undefined) {
    fills.push({
      label: 'additional location information',
      apply: (set) =>
        set('locationAdditionalInfo', locationAdditionalInfo, SET_OPTIONS),
    });
  }

  return fills;
};

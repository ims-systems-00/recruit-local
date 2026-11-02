import * as yup from 'yup';
import { TRAINING_SKILLS_MAX } from '@rl/types';

const awsStorageSchema = yup
  .object({
    Name: yup.string().required('File Name is required'),
    Bucket: yup.string().required('Bucket is required'),
    Key: yup.string().required('Key is required'),
  })
  .default(undefined);

const hasNoRepeats = (ids: string[]) => new Set(ids).size === ids.length;

// A catalogue entry: the id is what is saved, the name what a chip or card shows.
const catalogueSkillSchema = yup.object({
  _id: yup.string().required(),
  name: yup.string().required(),
});

// The form holds picked entries, so chips can show names without a lookup.
const pickedSkillsSchema = yup
  .array()
  .of(catalogueSkillSchema)
  .min(1, 'Add at least one skill')
  .max(TRAINING_SKILLS_MAX, `Add up to ${TRAINING_SKILLS_MAX} skills`)
  .test('unique', 'Each skill can only be added once', (skills) =>
    hasNoRepeats((skills ?? []).map((skill) => skill._id)),
  );

// The API takes catalogue ids, in the order picked.
const skillIdsSchema = yup
  .array()
  .of(yup.string().required())
  .min(1, 'Add at least one skill')
  .max(TRAINING_SKILLS_MAX, `Add up to ${TRAINING_SKILLS_MAX} skills`)
  .test('unique', 'Each skill can only be added once', (ids) =>
    hasNoRepeats(ids ?? []),
  );

const isAfterStart = (schema: yup.StringSchema) =>
  schema.test(
    'is-after-start',
    'End date cannot be earlier than start date',
    function (value) {
      const { startDate } = this.parent;

      if (!value || !startDate) return true;

      return new Date(value) >= new Date(startDate);
    },
  );

// Same rule as the backend: no end date while enrolled, so one left in the form is dropped.
const endDateSchema = (required: boolean) =>
  yup.string().when('isCurrentlyEnrolled', {
    is: true,
    then: (schema) => schema.strip(),
    otherwise: (schema) =>
      isAfterStart(
        required ? schema.required('End Date is required') : schema.optional(),
      ),
  });

// Yup schemas for validation
/** The Add/Edit Training form: every rule, whether adding or editing. */
export const trainingFormSchema = yup.object({
  organizationName: yup
    .string()
    .trim()
    .max(200, 'Organization Name must be at most 200 characters')
    .required('Organization Name is required'),
  courseName: yup
    .string()
    .trim()
    .max(200, 'Course Name must be at most 200 characters')
    .required('Course Name is required'),
  skills: pickedSkillsSchema.required('Add at least one skill'),
  isCurrentlyEnrolled: yup.boolean().default(false),
  startDate: yup.string().required('Start Date is required'),
  endDate: endDateSchema(true),
  certificateStorage: awsStorageSchema.optional(),
});

export const trainingCreateSchema = trainingFormSchema.shape({
  jobProfileId: yup.string().required('Job Profile ID is required'),
  skills: skillIdsSchema.required('Add at least one skill'),
});

export const trainingUpdateSchema = yup.object({
  organizationName: yup.string().trim().max(200).optional(),
  courseName: yup.string().trim().max(200).optional(),
  skills: skillIdsSchema.optional().default(undefined),
  isCurrentlyEnrolled: yup.boolean().optional(),
  startDate: yup.string().optional(),
  endDate: endDateSchema(false),
  certificateStorage: awsStorageSchema.optional(),
});

export const trainingIdParamsSchema = yup.object({
  id: yup.string().required('ID is required'),
});

const certificateSchema = yup
  .object({
    _id: yup.string().required(),
    src: yup.string().nullable(),
    visibility: yup.string().optional(),
    storageInformation: yup
      .object({
        Name: yup.string().optional(),
        Bucket: yup.string().optional(),
        Key: yup.string().optional(),
      })
      .optional()
      .default(undefined),
  })
  .nullable()
  .optional()
  .default(undefined);

export const trainingSchema = yup.object({
  _id: yup.string().required('ID is required'),
  jobProfileId: yup.string().required('Job Profile ID is required'),
  userId: yup.string().required('User ID is required'),
  organizationName: yup.string().required(),
  courseName: yup.string().required(),
  skills: yup.array().of(catalogueSkillSchema).required(),
  isCurrentlyEnrolled: yup.boolean().required(),
  startDate: yup.string().required(),
  endDate: yup.string().nullable().optional(),
  certificateId: yup.string().nullable().optional(),
  certificate: certificateSchema,
  createdAt: yup.string().required(),
  updatedAt: yup.string().required(),
});

export const trainingItemResponseSchema = yup.object({
  training: trainingSchema.required(),
  message: yup.string().optional(),
});

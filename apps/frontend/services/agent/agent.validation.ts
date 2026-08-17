import * as yup from 'yup';

export const agentConversationCreateSchema = yup.object({
  instruction: yup.string().required('Instruction is required'),
});

import { VerificationToken, VerificationTokenInput, IVerificationTokenDoc } from "../../../models";

interface VerificationInputWithId extends VerificationTokenInput {
  _id: string;
}

export const findOne = (filter: Partial<VerificationInputWithId>) => {
  return VerificationToken.findOne(filter);
};

export const findAll = (filter: Partial<VerificationTokenInput> = {}) => {
  return VerificationToken.find(filter);
};

export const create = (payload: VerificationTokenInput) => {
  const verificationToken = new VerificationToken(payload);
  return verificationToken.save();
};

export const update = (
  filter: Partial<VerificationInputWithId>,
  payload: Partial<VerificationTokenInput>
): Promise<IVerificationTokenDoc | null> => {
  return VerificationToken.findOneAndUpdate(filter, payload, { new: true });
};

export const remove = (filter: Partial<VerificationInputWithId>) => {
  return VerificationToken.findOneAndDelete(filter);
};

export const removeMany = (filter: Partial<VerificationInputWithId>) => {
  return VerificationToken.deleteMany(filter);
};

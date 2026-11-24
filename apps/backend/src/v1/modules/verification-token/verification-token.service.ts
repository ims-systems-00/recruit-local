import { VerificationToken, VerificationTokenInput, IVerificationTokenDoc } from "../../../models";
import { VERIFICATION_TOKEN_TYPE_ENUMS } from "../../../models/constants";
import { hashToken } from "../token/session-token";

interface VerificationInputWithId extends VerificationTokenInput {
  _id: string;
}

type CreateVerificationTokenInput = Omit<VerificationTokenInput, "tokenHash"> & { token: string };

export const findOne = (filter: Partial<VerificationInputWithId>) => {
  return VerificationToken.findOne(filter);
};

export const findByToken = (token: string, type?: VERIFICATION_TOKEN_TYPE_ENUMS) => {
  return VerificationToken.findOne({ tokenHash: hashToken(token), ...(type && { type }) });
};

export const findAll = (filter: Partial<VerificationTokenInput> = {}) => {
  return VerificationToken.find(filter);
};

export const create = ({ token, ...rest }: CreateVerificationTokenInput) => {
  const verificationToken = new VerificationToken({ ...rest, tokenHash: hashToken(token) });
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

import { IListParams } from "@inrm/types";
import { InterestInput, Interest } from "../../../models";
import { NotFoundException } from "../../../common/helper";

type IListInterestParams = IListParams<InterestInput>;

export const list = ({ query = {}, options }: IListInterestParams) => {
  return Interest.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getOne = async (id: string) => {
  const interest = await Interest.findOneWithExcludeDeleted({ _id: id });
  if (!interest) throw new NotFoundException("Interest not found.");
  return interest;
};

export const create = async (payload: InterestInput) => {
  let interest = new Interest(payload);
  interest = await interest.save();

  return interest;
};

export const update = async (id: string, payload: Partial<InterestInput>) => {
  const updatedInterest = await Interest.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );
  if (!updatedInterest) throw new NotFoundException("Interest not found.");
  return updatedInterest;
};

export const softRemove = async (id: string) => {
  const interest = await getOne(id);
  const { deleted } = await Interest.softDelete({ _id: id });

  return { interest, deleted };
};

export const hardRemove = async (id: string) => {
  const interest = await getOne(id);
  await Interest.findOneAndDelete({ _id: id });

  return interest;
};

export const restore = async (id: string) => {
  const { restored } = await Interest.restore({ _id: id });
  if (!restored) throw new NotFoundException("Interest not found in trash.");

  const interest = await getOne(id);

  return { interest, restored };
};

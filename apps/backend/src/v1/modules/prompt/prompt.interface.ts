import { ClientSession, Types } from "mongoose";
import {
  IServiceListParams,
  IServiceGetParams,
  IServiceUpdateParams,
} from "../../../common/interface/service.interface";
import { IPromptDoc, IPromptInput } from "../../../models/prompt.model";
import { PromptConfigDto } from "@rl/types";

// --- Standardized Parameter Interfaces ---

export type IPromptListParams = IServiceListParams<IPromptDoc>;
export type IPromptGetParams = IServiceGetParams<IPromptDoc>;

/**
 * `version` and `labels` are absent on purpose: the service allocates the
 * version and manages `latest`, so neither is a caller's to supply.
 */
export interface IPromptCreateParams {
  payload: Omit<IPromptInput, "version" | "labels"> & {
    createdBy?: Types.ObjectId;
  };
  session?: ClientSession;
}

/**
 * Metadata only. Content is immutable — changing it means a new version, which
 * is `create`. `variables` is absent because it is derived from the content.
 */
export interface IPromptUpdateParams extends IServiceUpdateParams<IPromptDoc> {
  payload: {
    commitMessage?: string;
    config?: PromptConfigDto;
  };
}

export interface IPromptSetLabelParams {
  name: string;
  label: string;
  version: number;
  session?: ClientSession;
}

export interface IPromptRemoveLabelParams {
  name: string;
  label: string;
  session?: ClientSession;
}

/** What the runtime resolver asks the service for. */
export interface IPromptResolveParams {
  name: string;
  label?: string;
}

import { ClientSession } from "mongoose";
import { JobOverviewRange } from "@rl/types";
import {
  IServiceListParams,
  IServiceGetParams,
  IServiceUpdateParams,
  IServiceCreateParams,
} from "../../../common/interface/service.interface";

// Assuming these are your imports based on context
import { ApplicationInput, IApplicationDoc } from "../../../models/application.model";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// --- Standardized Parameter Interfaces ---

export type IListApplicationParams = IServiceListParams<ApplicationInput> & { offset?: number };
export type IApplicationGetParams = IServiceGetParams<ApplicationInput>;
export type IApplicationCreateParams = IServiceCreateParams<
  ApplicationInput & { resumeStorage?: AwsStorageTemplate; caseStudyStorage?: AwsStorageTemplate[] }
>;
export type IApplicationUpdateParams = IServiceUpdateParams<
  IApplicationDoc & { resumeStorage?: AwsStorageTemplate; caseStudyStorage?: AwsStorageTemplate[] }
>;
export type IApplicationQueryParams = Partial<ApplicationInput & { _id: string }>;

export interface IApplicationStatusUpdateParams {
  query: IApplicationQueryParams;
  /**
   * The board column to move into. Was `status` — a name that never matched the
   * `statusId` the route validates, so the write landed on a field nothing reads.
   */
  statusId: string;
}

/**
 * One target column, one or more applications, all on the same job's board.
 * The board is per-job, so a batch spanning two jobs has no single valid target.
 */
export interface IApplicationMoveToStageParams {
  applicationIds: string[];
  statusId: string;
  session?: ClientSession;
}

export interface IMoveBoardItemParams {
  itemId: string;
  targetStatusId: string;
  targetIndex: number;
}

export interface IApplicationOverviewParams {
  /** Already security-scoped; must pin a single job. */
  query: Record<string, unknown>;
  jobId: string;
  range: JobOverviewRange;
  tz: string;
  /** Security scope for the job's board columns; `null` leaves `stages` out. */
  statusQuery: Record<string, unknown> | null;
  includeMatchScore: boolean;
}

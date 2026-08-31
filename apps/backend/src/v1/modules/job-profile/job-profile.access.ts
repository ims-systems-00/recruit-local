import { JobProfileAbilityBuilder, JobProfileAuthZEntity } from "@rl/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS, ISession } from "@rl/types";
import { BadRequestException, UnauthorizedException } from "../../../common/helper";
import { JobProfile } from "../../../models";

/**
 * A candidate's sub-resources — education, experience, skills, interests,
 * certifications, CVs — are only as public as the profile they hang off. CASL
 * cannot express that on its own: `visibility` lives on the JobProfile, not on
 * those documents, and conditions are built from the session alone. So every
 * read of someone else's records resolves the parent profile and reuses the
 * profile's own Read rule.
 */
export const assertCanReadJobProfile = async (session: ISession, jobProfileId: string): Promise<void> => {
  const ability = new JobProfileAbilityBuilder(session).getAbility();

  // Lean lookup on purpose — the full service aggregation populates values, job
  // titles, media and KYC, none of which the gate needs.
  const jobProfile = await JobProfile.findOne({ _id: jobProfileId, "deleteMarker.status": { $ne: true } })
    .select("_id status visibility")
    .lean();

  const authZEntity =
    jobProfile &&
    new JobProfileAuthZEntity({
      _id: String(jobProfile._id),
      status: jobProfile.status,
      visibility: jobProfile.visibility,
    });

  if (!authZEntity || !ability.can(AbilityAction.Read, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to view this candidate's records.");
  }
};

/**
 * Guard for the profile-scoped list endpoints. A list has to name one candidate,
 * or a recruiter could page through every candidate's history in a single call.
 * Reading your own records needs no filter — the CASL security query already
 * scopes those.
 */
export const assertProfileScopedListAccess = async (session: ISession, jobProfileId: unknown): Promise<void> => {
  if (session.user?.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) return;

  const requested = typeof jobProfileId === "string" ? jobProfileId : undefined;

  if (!requested) {
    if (!session.jobProfileId) throw new BadRequestException("A jobProfileId filter is required.");
    return;
  }

  if (requested === session.jobProfileId) return;

  await assertCanReadJobProfile(session, requested);
};

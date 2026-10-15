/**
 * One entry of the platform-wide skill catalogue — the list a job's skills are
 * picked from, so candidates can be matched on them.
 *
 * Not to be confused with `ISkill`, which is a candidate's own free-text skill
 * on their profile.
 */
export interface ISkillCatalog {
  name: string;
  description?: string;
  isActive?: boolean;
}

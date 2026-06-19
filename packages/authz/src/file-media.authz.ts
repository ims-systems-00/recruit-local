import {
  AbilityBuilder,
  AbilityClass,
  AbilityTuple,
  AnyAbility,
  PureAbility,
  buildMongoQueryMatcher,
  MongoQuery,
  fieldPatternMatcher,
} from '@casl/ability';

import {
  ACCOUNT_TYPE_ENUMS,
  ISession,
  IAbilityBuilder,
  AbilityAction,
} from '@rl/types';

export const ALL_FILE_MEDIA_FIELDS = [
  '_id',
  'id',
  'collectionName',
  'collectionDocument',
  'storageInformation',
  'storageInformation.*',
  'thumbnail',
  'thumbnail.*',
  'visibility',
  'src',
  'thumbnailSrc',
  'createdAt',
  'updatedAt',
  'isDeleted',
  'deletedAt',
];

export class FileMediaAuthZEntity {}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof FileMediaAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class FileMediaAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const { can } = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      can(AbilityAction.Manage, FileMediaAuthZEntity);
      return this.buildAbility();
    }

    can(AbilityAction.Create, FileMediaAuthZEntity, ALL_FILE_MEDIA_FIELDS);
    can(AbilityAction.Read, FileMediaAuthZEntity, ALL_FILE_MEDIA_FIELDS);
    can(AbilityAction.Update, FileMediaAuthZEntity, ALL_FILE_MEDIA_FIELDS);
    can(AbilityAction.SoftDelete, FileMediaAuthZEntity);
    can(AbilityAction.Restore, FileMediaAuthZEntity);
    can(AbilityAction.HardDelete, FileMediaAuthZEntity);

    return this.buildAbility();
  }

  private buildAbility(): AnyAbility {
    return this.abilityBuilder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}

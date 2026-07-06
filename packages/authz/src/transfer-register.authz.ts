import {
  AbilityBuilder,
  AbilityClass,
  AbilityTuple,
  AnyAbility,
  PureAbility,
  buildMongoQueryMatcher,
  MongoQuery,
} from '@casl/ability';

import {
  ACCOUNT_TYPE_ENUMS,
  ISession,
  IAbilityBuilder,
  AbilityAction,
} from '@rl/types';

export class TransferRegisterAuthZEntity {
  public readonly tenantId: string | null;
  constructor({ tenantId }: { tenantId: string | null }) {
    this.tenantId = tenantId ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof TransferRegisterAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class TransferRegisterAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Read, TransferRegisterAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.Create, TransferRegisterAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.Update, TransferRegisterAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.Delete, TransferRegisterAuthZEntity, {
        tenantId: this.session.tenantId,
      });
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, TransferRegisterAuthZEntity);
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      // builder.can(AbilityAction.Manage, TransferRegisterAuthZEntity);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}

import { AbilityBuilder, AnyAbility, createMongoAbility } from "@casl/ability";
import { IAbilityBuilder } from "../../../authz/builder.interface";
import { AbilityAction } from "../../../types/ability";
import { ISession } from "@inrm/types";
import { USER_TYPE_ENUMS } from "../../../models/constants/types-enums.constant";
import { modelNames } from "../../../models/constants/model-names.constant";

export class ResponseTemplateAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<AnyAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(createMongoAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const { can, cannot, build } = this.abilityBuilder;

    if (this.session.user.type === USER_TYPE_ENUMS.AUDITOR) {
      cannot(AbilityAction.Manage, modelNames.RESPONSE_TEMPLATE);
    }

    if (this.session.user.type === USER_TYPE_ENUMS.CUSTOMER) {
      can(AbilityAction.Read, modelNames.RESPONSE_TEMPLATE);
    }

    if (this.session.user.type === USER_TYPE_ENUMS.PLATFORM_ADMIN) {
      can(AbilityAction.Manage, modelNames.RESPONSE_TEMPLATE);
    }

    return build();
  }
}

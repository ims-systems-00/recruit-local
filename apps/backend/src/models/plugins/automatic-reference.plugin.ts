import { Schema } from "mongoose";
import autoIncrement from "@riadhossain43/mongoose-autoincrement";

autoIncrement.initialize();

interface IAutomaticReferencePluginOptions {
  model: string;
  referencePrefix: string;
}

const automaticReferencePlugin =
  ({ model, referencePrefix }: IAutomaticReferencePluginOptions) =>
  (schema: Schema) => {
    if (typeof model !== "string") throw new Error("Auto reference plugin error: 'model' must be a string");
    if (typeof referencePrefix !== "string")
      throw new Error("Auto reference plugin error: 'referencePrefix' must be a string");

    schema.plugin(autoIncrement.plugin, { model, field: "ID" });
    schema.add({
      reference: {
        type: String,
        default: null,
      },
    });
    schema.pre("validate", async function (next) {
      this.reference = `${referencePrefix}-${this.ID}`;
      next();
    });
  };

export { automaticReferencePlugin, IAutomaticReferencePluginOptions };

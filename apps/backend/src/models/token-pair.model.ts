import { Schema, model, Document, Model } from "mongoose";
import { User } from "./user.model";
import { modelNames } from "./constants";

// Define an interface for TokenPair input
export interface TokenPairInput {
  userId: Schema.Types.ObjectId;
  accessTokens: string[];
  refreshTokens: string[];
}

// Define an interface for the TokenPair document
export interface ITokenPairDoc extends TokenPairInput, Document {}

// Define an interface for the TokenPair model
interface ITokenPairModel extends Model<ITokenPairDoc> {}

// Define the schema for TokenPair
const tokenPairSchema = new Schema<ITokenPairDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
    },
    accessTokens: {
      type: [String],
      required: true,
    },
    refreshTokens: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Define the model
const TokenPair = model<ITokenPairDoc, ITokenPairModel>(modelNames.TOKEN_PAIR, tokenPairSchema);

export { TokenPair };

// src/types/mongoose-autoincrement.d.ts
declare module "@riadhossain43/mongoose-autoincrement" {
  import { Connection, Schema } from "mongoose";

  export function initialize(connection?: Connection): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function plugin(schema: Schema, options: any): void;
}

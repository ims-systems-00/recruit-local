import Agenda from "agenda";
import { constructDatabaseUrl } from "../.config/database";
import { AGENDA_COLLECTION } from "./constants";

export const agenda = new Agenda({
  db: {
    address: constructDatabaseUrl(process.env.MONGO_URL || "", process.env.DATABASE_NAME || ""),
    collection: AGENDA_COLLECTION,
  },
});

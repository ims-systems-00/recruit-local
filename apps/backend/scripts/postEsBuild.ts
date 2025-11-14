import * as shell from "shelljs";
shell.cp("-R", "src/v1/modules/email/templates/", "dist/src/v1/modules/email/templates/");
shell.cp("-R", "src/assets/", "dist/src/assets/");

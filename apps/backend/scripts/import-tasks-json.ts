import fs from "fs";
import path from "path";
import { Types } from "mongoose";
import moment from "moment";
import { Task } from "../src/models/tasks.model";
import { Tenant } from "../src/models/tenant.model";
import { Category } from "../src/models/category.model";
import { CATEGORY_USED_FOR_ENUMS, TASK_PRIORITY_ENUMS, TASK_STATUS_ENUMS } from "@rl/types";

export const IMPORT_FLAG = "--tasks";
const JSON_FILE_PATH = path.join(__dirname, "data", "14-10-25-tasks.json");
const ASSIGNED_TO_IDS = ["68da1e60977f4e53b00104d8"];

interface TaskInput {
  title: string;
  category: string;
  dueDate?: string;
  status: string;
  priority: string;
  organisation: string;
  description?: string;
}

const normalize = (val: string): string => val.trim().normalize("NFC").toLocaleLowerCase("tr");
const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const importTasksFromJson = async () => {
  try {
    // 1️⃣ Read and parse JSON file
    const raw = fs.readFileSync(JSON_FILE_PATH, "utf-8");
    const tasksData: TaskInput[] = JSON.parse(raw);
    console.log(`✅ Parsed ${tasksData.length} tasks from JSON file`);

    // 2️⃣ Prepare regex filters to detect existing tasks
    const titleRegexFilters = tasksData.map((t) => ({
      title: { $regex: `^${escapeRegex(t.title.trim())}$`, $options: "i" },
    }));

    // 3️⃣ Find existing tasks in DB
    const existingTasks = await Task.find({ $or: titleRegexFilters })
      .collation({ locale: "tr", strength: 2 })
      .select("_id title");

    const existingTitleSet = new Set(existingTasks.map((t) => normalize(t.title)));

    // 4️⃣ Filter out already existing tasks
    const tasksToInsert = tasksData.filter((t) => !existingTitleSet.has(normalize(t.title)));

    if (tasksToInsert.length === 0) {
      console.log("ℹ️ No new tasks to insert (all duplicates).");
      return;
    }

    // 5️⃣ Handle categories (create if not exist)
    const uniqueCategories = Array.from(new Set(tasksToInsert.map((t) => t.category.trim()).filter(Boolean)));

    const existingCategories = await Category.find({
      labelText: { $in: uniqueCategories },
    }).select("_id labelText");

    const categoryMap = new Map<string, Types.ObjectId>();
    existingCategories.forEach((c: any) => categoryMap.set(c.labelText, c._id));

    const categoriesToCreate = uniqueCategories.filter((c) => !categoryMap.has(c));

    if (categoriesToCreate.length > 0) {
      const newCategories = await Category.insertMany(
        categoriesToCreate.map((labelText) => ({
          usedFor: [CATEGORY_USED_FOR_ENUMS.TASK_CATEGORY],
          labelText,
        }))
      );
      newCategories.forEach((c: any) => categoryMap.set(c.labelText, c._id));
      console.log(`🗂️ Inserted ${newCategories.length} new categories`);
    }

    // 6️⃣ Prepare Tenant (organisation) lookup cache
    const tenantCache = new Map<string, string>();

    const findTenantId = async (orgName: string): Promise<string | null> => {
      if (!orgName || orgName.trim().length < 5) return null;
      const cached = tenantCache.get(orgName);
      if (cached) return cached;

      const partialLength = Math.ceil(orgName.length / 2);
      const partial = orgName.slice(0, partialLength).trim();
      const regex = new RegExp(escapeRegex(partial), "i");

      const tenant = await Tenant.findOne({ name: regex }).select("_id name").lean();

      if (tenant?._id) {
        tenantCache.set(orgName, tenant._id.toString());
        return tenant._id.toString();
      }
      return null;
    };

    // 7️⃣ Build insert payloads
    const preparedTasks = [];
    for (const t of tasksToInsert) {
      const categoryId = categoryMap.get(t.category);
      const tenantId = await findTenantId(t.organisation);

      const dueDate = t.dueDate ? moment(t.dueDate, "DD/MM/YYYY").toDate() : undefined;
      const status = t.status || TASK_STATUS_ENUMS.PENDING;
      const priority = t.priority || TASK_PRIORITY_ENUMS.LOW;

      preparedTasks.push({
        title: t.title.trim(),
        description: t.description || "",
        dueDate,
        status,
        priority,
        category: categoryId,
        relatedOrganisation: tenantId ? [tenantId] : [],
        assignedTo: ASSIGNED_TO_IDS,
      });
    }

    // 8️⃣ Insert tasks
    if (preparedTasks.length > 0) {
      const result = await Task.insertMany(preparedTasks, { ordered: false });
      console.log(`🎉 Inserted ${result.length} new tasks`);
    } else {
      console.log("ℹ️ No new tasks to insert.");
    }

    console.log("✅ Task import completed successfully.");
  } catch (error) {
    console.error("❌ Failed to import tasks:", error);
  }
};

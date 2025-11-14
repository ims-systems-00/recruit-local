import fs from "fs";
import path from "path";
import { Tenant, ITenantDoc } from "../src/models/tenant.model";
import { Location } from "../src/models/location.model";

// -------- CONFIGURATION --------
export const IMPORT_FLAG = "--tenants";
const JSON_FILE_PATH = path.join(__dirname, "data", "07-10-25-tenants.json");
const DUPLICATE_OUTPUT_PATH = JSON_FILE_PATH.replace(/\.json$/, "-duplicates.json");

// -------- TYPES --------
interface LocationInput {
  addressBuilding: string;
  addressStreet: string;
  addressStreet2: string;
  addressStreet3: string;
  addressCity: string;
  addressStateProvince: string;
  addressPostCode: string;
  addressCountry: string;
}

interface TenantInput {
  name: string;
  addressBuilding: string;
  addressStreet: string;
  addressStreet2: string;
  addressCity: string;
  addressStateProvince: string;
  addressPostCode: string;
  addressCountry: string;
  locations?: LocationInput[];
}

// -------- UTILITIES --------
const normalizeName = (name: string): string => name.trim().normalize("NFC").toLocaleLowerCase("tr");

const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// -------- MAIN IMPORT FUNCTION --------
export const importTenantsFromJson = async () => {
  try {
    // 1️⃣ Read and parse JSON file
    const raw = fs.readFileSync(JSON_FILE_PATH, "utf-8");
    const tenantsData: TenantInput[] = JSON.parse(raw);
    console.log(`✅ Parsed ${tenantsData.length} tenants from JSON file`);

    // 2️⃣ Prepare regex filters to detect duplicates
    const nameRegexFilters = tenantsData.map((tenant) => ({
      name: { $regex: `^${escapeRegex(tenant.name.trim())}$`, $options: "i" },
    }));

    // 3️⃣ Find existing tenants in DB
    const existingTenants = await Tenant.find({ $or: nameRegexFilters })
      .collation({ locale: "tr", strength: 2 })
      .select("_id name");

    const existingNameMap = new Map(existingTenants.map((t) => [normalizeName(t.name), t._id]));

    // 4️⃣ Separate new vs duplicate tenants
    const tenantsToInsert: TenantInput[] = [];
    const duplicates: TenantInput[] = [];

    for (const tenant of tenantsData) {
      const normalized = normalizeName(tenant.name);
      if (existingNameMap.has(normalized)) {
        duplicates.push(tenant);
      } else {
        tenantsToInsert.push(tenant);
      }
    }

    // 5️⃣ Save duplicates for review
    if (duplicates.length > 0) {
      fs.writeFileSync(DUPLICATE_OUTPUT_PATH, JSON.stringify(duplicates, null, 2), "utf-8");
      console.log(`📝 Saved ${duplicates.length} duplicate tenants to ${DUPLICATE_OUTPUT_PATH}`);
    }

    // 6️⃣ Insert NEW tenants
    let insertedTenants: ITenantDoc[] = [];
    if (tenantsToInsert.length > 0) {
      insertedTenants = await Tenant.insertMany(
        tenantsToInsert.map((t) => ({
          name: t.name.trim(),
          addressBuilding: t.addressBuilding,
          addressStreet: t.addressStreet,
          addressStreet2: t.addressStreet2,
          addressCity: t.addressCity,
          addressStateProvince: t.addressStateProvince,
          addressPostCode: t.addressPostCode,
          addressCountry: t.addressCountry,
        })),
        { ordered: false }
      );
      console.log(`🎉 Inserted ${insertedTenants.length} new tenants`);
    }

    // 7️⃣ Build tenantId map for ALL tenants (new + duplicates)
    const tenantIdMap = new Map<string, string>();
    insertedTenants.forEach((t) => tenantIdMap.set(normalizeName(t.name), t._id.toString()));
    existingTenants.forEach((t) => tenantIdMap.set(normalizeName(t.name), t._id.toString()));

    // 8️⃣ Build a flat array of locations for all tenants
    const locationsToInsert = tenantsData.flatMap((tenant) => {
      const tenantId = tenantIdMap.get(normalizeName(tenant.name));
      if (!tenantId || !Array.isArray(tenant.locations)) return [];

      return tenant.locations.map((loc) => ({
        tenantId,
        locationRef: loc.addressBuilding,
        addressBuilding: loc.addressBuilding,
        addressStreet: loc.addressStreet,
        addressStreet2: loc.addressStreet2,
        addressStreet3: loc.addressStreet3,
        addressCity: loc.addressCity,
        addressStateProvince: loc.addressStateProvince,
        addressPostCode: loc.addressPostCode,
        addressCountry: loc.addressCountry,
      }));
    });

    // 9️⃣ Insert all locations
    if (locationsToInsert.length > 0) {
      const result = await Location.insertMany(locationsToInsert, { ordered: false });
      console.log(`📍 Inserted ${result.length} locations successfully`);
    } else {
      console.log("ℹ️ No locations to insert.");
    }

    console.log("✅ Tenant import completed successfully.");
  } catch (error) {
    console.error("❌ Failed to import tenants:", error);
  }
};

import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { Tenant } from "../src/models/tenant.model";

export const IMPORT_FLAG = "--tenants";
const CSV_FILE_PATH = path.join(__dirname, "data", "22-09-25-tenants.csv");
const DUPLICATE_OUTPUT_PATH = CSV_FILE_PATH.replace(/\.csv$/, "-duplicates.json");

interface CsvRow {
  name: string;
  addressBuilding: string;
  addressStreet: string;
  addressStreet2: string;
  addressCity: string;
  addressStateProvince: string;
  addressPostCode: string;
  addressCountry: string;
}

// Read and parse CSV
const parseCsvFile = (filePath: string): Promise<CsvRow[]> => {
  return new Promise((resolve, reject) => {
    const records: CsvRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: CsvRow) => records.push(row))
      .on("end", () => resolve(records))
      .on("error", (error) => reject(error));
  });
};

// Escape regex special characters
const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Normalize name for Turkish case-insensitive match
const normalizeName = (name: string): string => name.trim().normalize("NFC").toLocaleLowerCase("tr");

export const importTenants = async () => {
  try {
    const csvRows = await parseCsvFile(CSV_FILE_PATH);
    console.log(`✅ Parsed ${csvRows.length} records from CSV`);

    // Create regex queries for MongoDB lookup
    const nameRegexFilters = csvRows.map((row) => ({
      name: {
        $regex: `^${escapeRegex(row.name.trim())}$`,
        $options: "i",
      },
    }));

    // Fetch existing tenants with collation for Turkish
    const existingTenants = await Tenant.find({
      $or: nameRegexFilters,
    })
      .collation({ locale: "tr", strength: 2 })
      .select("name");

    const existingNames = new Set(existingTenants.map((t) => normalizeName(t.name)));

    const duplicates: CsvRow[] = [];
    const tenantsToInsert = csvRows
      .filter((row) => {
        const isDuplicate = existingNames.has(normalizeName(row.name));
        if (isDuplicate) {
          // console.log(`🔁 Skipping duplicate: ${row.name}`);
          duplicates.push({
            name: row.name.trim(),
            addressBuilding: row.addressBuilding,
            addressStreet: row.addressStreet,
            addressStreet2: row.addressStreet2,
            addressCity: row.addressCity,
            addressStateProvince: row.addressStateProvince,
            addressPostCode: row.addressPostCode,
            addressCountry: row.addressCountry,
          });
        }
        return !isDuplicate;
      })
      .map((row) => ({
        name: row.name.trim(),
        addressBuilding: row.addressBuilding,
        addressStreet: row.addressStreet,
        addressStreet2: row.addressStreet2,
        addressCity: row.addressCity,
        addressStateProvince: row.addressStateProvince,
        addressPostCode: row.addressPostCode,
        addressCountry: row.addressCountry,
      }));

    // Write duplicates to JSON file
    if (duplicates.length > 0) {
      fs.writeFileSync(DUPLICATE_OUTPUT_PATH, JSON.stringify(duplicates, null, 2), "utf-8");
      console.log(`📝 Saved ${duplicates.length} duplicate tenants to ${DUPLICATE_OUTPUT_PATH}`);
    }

    if (tenantsToInsert.length > 0) {
      const result = await Tenant.insertMany(tenantsToInsert);
      console.log(`🎉 Successfully inserted ${result.length} new tenants`);
    } else {
      console.log("ℹ️ No new tenants to insert.");
    }
  } catch (error) {
    console.error("❌ Failed to import tenants:", error);
  }
};

import DocxTemplate from "docxtemplater";
import expressionParser from "docxtemplater/expressions";
import PizZip from "pizzip";
import fs from "fs";
import * as path from "path";

export const ISO_CERT_METADATA = {
  organisation_name: "Green Earth Solutions Ltd",
  address_line_1: "123 Eco Street",
  address_line_2: "Innovation Park",
  city: "Birmingham",
  province_state: "West Midlands",
  country: "United Kingdom",
  post_code: "B1 2AB",
  certificate_number: "ISO14001-2025-UK-0372",
  certificate_scope:
    "The provision of environmental consulting and auditing services across commercial and industrial sectors.",
  first_issue_date: "12/05/2019",
  interface_issue_date: "10/03/2021",
  issue_date: "01/06/2025",
  expiry_date: "31/05/2028",
};

export const PEFC_CERT_METADATA = {
  organisation_name: "Green Earth Solutions Ltd",
  organisation: {
    name: "Green Earth Solutions Ltd",
    addressBuilding: "123 Eco Street",
    addressStreet: "Innovation Park",
    addressCity: "Birmingham",
    addressPostCode: "B1 2AB",
    addressStateProvince: "West Midlands",
    addressCountry: "United Kingdom",
  },
  address_line_1: "123 Eco Street",
  address_line_2: "Innovation Park",
  city: "Birmingham",
  province_state: "West Midlands",
  country: "United Kingdom",
  post_code: "B1 2AB",
  certification_type: "PEFC",
  type_of_product: "Wood",
  coc_reference_pefc: "COC-12025-UK-0372",
  certificate_number: "PEFC-12025-UK-0372",
  pefc_methods: "PEFC-12025-UK-0372",
  certificate_scope:
    "The provision of environmental consulting and auditing services across commercial and industrial sectors.",
  first_issue_date: "12/05/2019",
  interface_issue_date: "10/03/2021",
  issue_date: "01/06/2025",
  issue_number: "1234567890",
  expiry_date: "31/05/2028",
  locations: [
    {
      name: "Green Earth Solutions Ltd",
      address: "123 Eco Street",
      sub_code: "COC-12025-UK-0372",
    },
    {
      name: "Hillsborough",
      address: "123 Eco Street",
      sub_code: "COC-12025-UK-0373",
    },
    {
      name: "Hillsborough",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0374",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },

    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
    {
      name: "Head Office",
      address: "123 Eco Street 2",
      sub_code: "COC-12025-UK-0375",
    },
  ],
};

const zip = new PizZip(
  fs.readFileSync(
    path.resolve(
      __dirname,
      "..",
      "..",
      "assets",
      "documents",
      "coc-certificates",
      "interface-pefc-certificate-multisite-id-47727.docx"
    )
  )
);
const doc = new DocxTemplate(zip, {
  parser: expressionParser,
});
doc.render(PEFC_CERT_METADATA);
fs.writeFileSync(path.resolve(__dirname, "..", "..", "assets", "documents", "output.docx"), doc.toBuffer());

import { encode } from "base64-arraybuffer";
import { v4 as uuidv4 } from "uuid";
import { kvGet, kvSet } from "./storage";

// Demo data loaded the first time the app opens. All people are fictional.
const SEED_USERS = [
  {
    first_name: "Avery",
    last_name: "Morgan",
    email_address: "avery.morgan@example.com",
    address: "123 Example Street, Springfield, IL 62701",
  },
  {
    first_name: "Jordan",
    last_name: "Lee",
    email_address: "jordan.lee@example.com",
    address: "456 Sample Avenue, Portland, OR 97201",
  },
  {
    first_name: "Sam",
    last_name: "Rivera",
    email_address: "sam.rivera@example.com",
    address: "789 Demo Road, Austin, TX 78701",
  },
];

const SAMPLE_TEMPLATES = [
  {
    file: "employee-agreement.docx",
    title: "Employee Agreement.docx",
    description: "Employment terms for a new hire.",
  },
  {
    file: "non-disclosure-agreement.docx",
    title: "Non-Disclosure Agreement.docx",
    description: "Keeps shared business information confidential.",
  },
];

const loadSampleTemplate = async (sample: (typeof SAMPLE_TEMPLATES)[number]) => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}samples/${sample.file}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    return {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      title: sample.title,
      description: sample.description,
      file_extension: "docx",
      file_data: encode(buffer),
    };
  } catch (error) {
    console.warn(`Could not load the sample template ${sample.file}.`, error);
    return null;
  }
};

// Bump this when the sample data changes. Browsers that saved an older version
// of the demo get the new sample data (this replaces their local demo data).
const SEED_VERSION = 2;

export const seedIfEmpty = async (): Promise<void> => {
  if ((await kvGet<number>("seed_version")) === SEED_VERSION) return;

  const now = new Date().toISOString();
  await kvSet(
    "users",
    SEED_USERS.map((user) => ({ id: uuidv4(), created_at: now, ...user }))
  );

  const templates = (await Promise.all(SAMPLE_TEMPLATES.map(loadSampleTemplate))).filter(
    (t) => t !== null
  );
  await kvSet("templates", templates);
  await kvSet("agreements", []);
  await kvSet("seed_version", SEED_VERSION);
};

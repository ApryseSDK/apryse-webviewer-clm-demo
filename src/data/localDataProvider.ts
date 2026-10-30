import type {
  BaseRecord,
  CrudFilter,
  CrudSort,
  DataProvider,
} from "@refinedev/core";
import { v4 as uuidv4 } from "uuid";
import { seedIfEmpty } from "./seed";
import { kvGet, kvSet } from "./storage";

// A Refine data provider that keeps everything in the browser (IndexedDB).
// Three collections are used: "templates", "users" and "agreements".
// "file_data" holds a base64-encoded DOCX (templates) or PDF (agreements).

type Row = BaseRecord;

const notFound = (resource: string, id: unknown) => ({
  message: `${resource} record ${String(id)} was not found`,
  statusCode: 404,
});

// Seed once, before the first read or write.
const ready = seedIfEmpty();

// Writes are queued so two quick saves cannot overwrite each other.
let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(task: () => Promise<T>): Promise<T> => {
  const result = queue.then(task, task);
  queue = result.catch(() => undefined);
  return result;
};

const load = async (resource: string): Promise<Row[]> => {
  await ready;
  return (await kvGet<Row[]>(resource)) ?? [];
};

const save = (resource: string, rows: Row[]) => kvSet(resource, rows);

// Agreements show the signer's name and the template title, so join them in.
const withRelations = async (resource: string, rows: Row[]): Promise<Row[]> => {
  if (resource !== "agreements") return rows;
  const [users, templates] = await Promise.all([load("users"), load("templates")]);
  return rows.map((row) => ({
    ...row,
    users: users.find((u) => u.id === row.user_id) ?? {
      first_name: "(deleted",
      last_name: "signer)",
    },
    templates: templates.find((t) => t.id === row.template_id) ?? {
      title: "(deleted template)",
    },
  }));
};

// Lists do not need the (large) file contents.
const withoutFileData = (row: Row): Row => {
  const rest = { ...row };
  delete rest.file_data;
  return rest;
};

const matches = (row: Row, filter: CrudFilter): boolean => {
  if (!("field" in filter)) return true;
  const value = row[filter.field];
  switch (filter.operator) {
    case "eq":
      return value === filter.value;
    case "ne":
      return value !== filter.value;
    case "in":
      return Array.isArray(filter.value) && filter.value.includes(value);
    case "contains":
      return String(value ?? "").toLowerCase().includes(String(filter.value).toLowerCase());
    default:
      return true;
  }
};

const compare = (a: Row, b: Row, sorters: CrudSort[]): number => {
  for (const { field, order } of sorters) {
    if (a[field] === b[field]) continue;
    const direction = order === "desc" ? -1 : 1;
    return (a[field] ?? "") > (b[field] ?? "") ? direction : -direction;
  }
  return 0;
};

export const localDataProvider: DataProvider = {
  getApiUrl: () => "",

  getList: async ({ resource, pagination, filters = [], sorters }) => {
    const all = await load(resource);
    const filtered = all.filter((row) => filters.every((f) => matches(row, f)));

    // Newest first unless the table asks for something else.
    const order: CrudSort[] = sorters?.length
      ? sorters
      : [{ field: "created_at", order: "desc" }];
    filtered.sort((a, b) => compare(a, b, order));

    const { currentPage = 1, pageSize = 10, mode = "server" } = pagination ?? {};
    const page =
      mode === "off"
        ? filtered
        : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const rows = (await withRelations(resource, page)).map(withoutFileData);
    return { data: rows as never, total: filtered.length };
  },

  getMany: async ({ resource, ids }) => {
    const all = await load(resource);
    const rows = all.filter((row) => ids.includes(row.id as string));
    return { data: (await withRelations(resource, rows)).map(withoutFileData) as never };
  },

  getOne: async ({ resource, id }) => {
    const all = await load(resource);
    const row = all.find((r) => r.id === id);
    if (!row) throw notFound(resource, id);
    const [joined] = await withRelations(resource, [row]);
    return { data: joined as never };
  },

  create: ({ resource, variables }) =>
    serial(async () => {
      const all = await load(resource);
      const row: Row = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        ...(resource === "agreements" ? { status: "Awaiting Signature" } : {}),
        ...(variables as object),
      };
      await save(resource, [...all, row]);
      return { data: row as never };
    }),

  update: ({ resource, id, variables }) =>
    serial(async () => {
      const all = await load(resource);
      const index = all.findIndex((r) => r.id === id);
      if (index === -1) throw notFound(resource, id);
      const updated: Row = { ...all[index], ...(variables as object) };
      all[index] = updated;
      await save(resource, all);
      return { data: updated as never };
    }),

  deleteOne: ({ resource, id }) =>
    serial(async () => {
      const all = await load(resource);
      const row = all.find((r) => r.id === id);
      if (!row) throw notFound(resource, id);
      await save(resource, all.filter((r) => r.id !== id));
      return { data: row as never };
    }),
};

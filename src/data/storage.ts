// A tiny key-value store backed by the browser's IndexedDB, so the demo needs
// no server or database. IndexedDB (rather than localStorage) is used because
// generated PDFs can be larger than localStorage's ~5 MB limit.
// If IndexedDB is unavailable (some private-browsing modes), it falls back to
// memory and the data lasts until the page is reloaded.

const DB_NAME = "webviewer-clm";
const STORE = "kv";

const memory = new Map<string, unknown>();

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

// Decided once: true when IndexedDB works, false when we must use memory.
const dbPromise: Promise<IDBDatabase | null> = openDb().catch(() => {
  console.warn("IndexedDB is unavailable; demo data will not persist across reloads.");
  return null;
});

const run = <T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> =>
  new Promise((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const kvGet = async <T>(key: string): Promise<T | undefined> => {
  const db = await dbPromise;
  if (!db) return memory.get(key) as T | undefined;
  return run<T | undefined>(db, "readonly", (store) => store.get(key));
};

export const kvSet = async (key: string, value: unknown): Promise<void> => {
  const db = await dbPromise;
  if (!db) {
    memory.set(key, value);
    return;
  }
  await run(db, "readwrite", (store) => store.put(value, key));
};

export const kvClear = async (): Promise<void> => {
  memory.clear();
  const db = await dbPromise;
  if (db) await run(db, "readwrite", (store) => store.clear());
};

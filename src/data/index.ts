import { ROLE_STORAGE_KEY } from "../contexts/role";
import { kvClear } from "./storage";

export { localDataProvider } from "./localDataProvider";

// Wipes everything and reloads; the sample data is restored on the next load.
export const resetDemoData = async () => {
  await kvClear();
  try {
    localStorage.removeItem(ROLE_STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
  window.location.assign("/");
};

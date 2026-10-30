import type WebViewer from "@pdftron/webviewer";

type WebViewerOptions = Parameters<typeof WebViewer>[0];

// Get a free trial key at https://dev.apryse.com and put it in `.env`:
//   VITE_APRYSE_LICENSE_KEY=your-key
export const LICENSE_KEY: string | undefined =
  import.meta.env.VITE_APRYSE_LICENSE_KEY || undefined;

// The WebViewer UI and core files are copied to this folder when you run `npm install`.
export const WEBVIEWER_PATH = "/webviewer/lib";

export const wvOptions = (
  overrides: Partial<WebViewerOptions> = {},
): WebViewerOptions => ({
  path: WEBVIEWER_PATH,
  licenseKey: LICENSE_KEY,
  ...overrides,
});

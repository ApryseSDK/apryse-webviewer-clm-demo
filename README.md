# Apryse WebViewer CLM Demo: contract lifecycle management in the browser

**A browser-only reference app showing contract lifecycle management (CLM) with [Apryse WebViewer](https://apryse.com/products/webviewer)** (Apryse was formerly PDFTron). Edit Word (DOCX) contract templates, merge signer data into them, generate PDFs with signature fields, and collect signatures, with a full-featured Admin view and a simplified Signer view. No backend, database, or login required.

Companion code for the video **[How We Solve CLM Challenges in Production | Apryse](https://www.youtube.com/watch?v=IJF2kvWfaWE)**.

## What it demonstrates

| Step                 | What happens                                                                                                        | Apryse feature                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Edit a template      | An Employee Agreement or NDA (DOCX) is edited in the browser, with merge fields and a signature marker              | WebViewer DOCX editor (`enableOfficeEditing`, `initialMode: "docxEditor"`) |
| Merge data           | `{{first_name}}`, `{{last_name}}`, `{{address}}`, `{{company_address}}`, `{{date}}` are filled from a signer record | `doc.applyTemplateValues()`                                                |
| Convert              | The filled DOCX becomes a PDF in the browser                                                                        | `getFileData({ downloadType: "pdf" })`                                     |
| Add signature fields | Each `[Signature]` marker is found and replaced by a signature field                                                | `PDFNet.TextSearch`, `ContentReplacer`, `SignatureWidget` (full API)       |
| Generate in bulk     | Select several signers to create one agreement each                                                                 | Same pipeline, run once per signer                                         |
| Role-based viewer    | Admins get the full WebViewer UI; signers get a simplified one                                                      | `UI.disableElements()`, `UI.setToolbarGroup()`                             |
| Sign                 | The signer signs in the viewer and the signed PDF is saved                                                          | XFDF export with `getFileData({ xfdfString })`                             |
| Review               | Finished agreements open read-only                                                                                  | `UI.enableViewOnlyMode()`                                                  |

## Admin view and Signer view

Use the **View as** dropdown in the header to switch roles. There is no login.

|                     | Admin                                                                   | Signer                                        |
| ------------------- | ----------------------------------------------------------------------- | --------------------------------------------- |
| Menu                | Templates, Signers, Agreements                                          | Agreements only                               |
| Templates           | View, edit in the DOCX editor, delete                                   | Not available                                 |
| Agreements          | All agreements, create and delete                                       | Only their own, no create or delete           |
| Viewer when signing | Full ribbon: View, Annotate, Shapes, Insert, Edit, Fill and Sign, Forms | Fill and Sign only, with the file menu hidden |

> **This is a UI demo, not access control.** Roles are chosen in the browser and everything is stored locally, so nothing here is secure. In a real product, enforce permissions on your server and use the same WebViewer UI settings to match what each user is allowed to do.

## Getting started

Requires Node.js 18 or later.

Get a free trial key at [dev.apryse.com](https://dev.apryse.com).

```bash
git clone https://github.com/ApryseSDK/apryse-webviewer-clm-demo.git
cd apryse-webviewer-clm-demo
npm install          # also copies the WebViewer files into public/webviewer/lib
cp .env.example .env # add your Apryse license key
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Try it

1. Open **Templates**, then edit the Non-Disclosure Agreement. You will see the `{{merge fields}}` and the `[Signature]` marker in the document.
2. Open **Agreements**, click **Create**, choose one or more signers and the template, then **Generate**. Each agreement opens with the signer's details filled in and a signature field.
3. Switch **View as** to that signer. Notice the reduced menu and the Fill and Sign-only toolbar. Click **Sign**, add a signature, and click **Finish signing**. The status changes to Signed.
4. Switch back to **Admin** to see every agreement and its status.

Use **Reset demo data** in the header to clear the browser storage and start over.

## Make your own template

Edit a template (or create one) in the DOCX editor and use these merge fields:

| Field                             | Filled with                                                           |
| --------------------------------- | --------------------------------------------------------------------- |
| `{{first_name}}`, `{{last_name}}` | The signer's name                                                     |
| `{{address}}`                     | The signer's address                                                  |
| `{{company_address}}`             | A fixed company address set in `src/pages/agreements/create.tsx`      |
| `{{date}}`                        | Today's date                                                          |
| `[Signature]`                     | Becomes a required signature field. Any text in square brackets does. |

## How it works

```
src/
  contexts/role/        "View as" role (Admin or a signer)
  data/                 IndexedDB storage, seed data, and a Refine data provider
  pages/
    templates/          list, create, edit (DOCX editor)
    users/              signers (list, create, edit)
    agreements/         create (generation), list, show (view-only), sign
  utility/              WebViewer options (license key, path)
public/samples/         employee-agreement.docx, non-disclosure-agreement.docx
tools/
  copy-webviewer-files.cjs   copies WebViewer into public/ after install
```

- **Generation:** `generateAgreement()` in `src/pages/agreements/create.tsx` loads the template, merges values, converts to PDF, and replaces each `[placeholder]` with a signature field.
- **Signer UI:** `simplifyForSigner()` in `src/pages/agreements/sign.tsx` hides the extra toolbar groups and selects Fill and Sign.
- **Data:** the `webviewer-clm` IndexedDB database holds three collections (`templates`, `users`, `agreements`). Files are stored as base64.

## Related resources

- [Enhance CLM with embedded workflows](https://apryse.com/enhance-clm-with-embedded-workflows)
- [In-app contract workflows (blog)](https://apryse.com/blog/in-app-contract-workflows)
- [WebViewer documentation](https://docs.apryse.com/) (also available as [llms.txt](https://docs.apryse.com/llms.txt) for AI tools)
- [Apryse on GitHub](https://github.com/ApryseSDK)

## License

MIT. See [LICENSE](LICENSE). Apryse WebViewer is commercial software and is licensed separately.

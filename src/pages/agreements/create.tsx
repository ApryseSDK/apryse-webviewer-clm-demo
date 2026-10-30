import { Create, useSelect } from "@refinedev/antd";
import { type BaseRecord, useCreate, useDataProvider, useNavigation } from "@refinedev/core";
import { Alert, Flex, Form, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import WebViewer, { type WebViewerInstance } from "@pdftron/webviewer";
import { decode, encode } from "base64-arraybuffer";
import { v4 as uuidv4 } from "uuid";
import { wvOptions } from "../../utility";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Shown in the sample template wherever {{company_address}} appears.
const COMPANY_ADDRESS = "555 Burrard St, Vancouver, BC V7X 1M7";

// Any [text in square brackets] left in the contract becomes a signature field.
const SIGNATURE_PLACEHOLDER = "\\[.*?\\]";

type Signer = {
  first_name?: string;
  last_name?: string;
  address?: string;
};

type Template = {
  title: string;
  file_data: string;
};

// Fills the DOCX template with a signer's details, converts it to PDF, and
// turns each [placeholder] into a required signature field.
// Returns the finished PDF as base64.
const generateAgreement = async (
  wv: WebViewerInstance,
  templateBase64: string,
  signer: Signer
): Promise<string> => {
  const { Core } = wv;
  const { PDFNet } = Core;

  // 1. Load the DOCX template.
  const blob = new Blob([new Uint8Array(decode(templateBase64))], { type: DOCX_MIME });
  const doc = await Core.createDocument(blob, { extension: "docx" });

  // 2. Merge the signer's data into the {{placeholders}}.
  const formattedDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());
  await doc.applyTemplateValues({
    date: formattedDate,
    first_name: signer.first_name ?? "",
    last_name: signer.last_name ?? "",
    address: signer.address ?? "",
    company_address: COMPANY_ADDRESS,
  });

  // 3. Convert the filled document to PDF.
  const pdfData = await doc.getFileData({ downloadType: "pdf" });
  const pdf = await PDFNet.PDFDoc.createFromBuffer(pdfData as ArrayBuffer);

  // 4. Find every [placeholder] and put a signature field over it.
  const textSearch = await PDFNet.TextSearch.create();
  const replacer = await PDFNet.ContentReplacer.create();
  const mode =
    PDFNet.TextSearch.Mode.e_whole_word |
    PDFNet.TextSearch.Mode.e_reg_expression |
    PDFNet.TextSearch.Mode.e_highlight;

  await textSearch.begin(pdf, SIGNATURE_PLACEHOLDER, mode);

  let result = await textSearch.run();
  while (result.code !== PDFNet.TextSearch.ResultCode.e_done) {
    if (result.code === PDFNet.TextSearch.ResultCode.e_found) {
      const highlights = result.highlights;
      highlights.begin(pdf);
      const quad = (await highlights.getCurrentQuads())[0];
      const mathRect = new Core.Math.Quad(
        quad.p1x, quad.p1y, quad.p2x, quad.p2y,
        quad.p3x, quad.p3y, quad.p4x, quad.p4y
      ).toRect();
      const rect = new PDFNet.Rect(mathRect.x1, mathRect.y1, mathRect.x2, mathRect.y2);

      await replacer.addString(result.out_str.slice(1, -1), "");
      const page = await pdf.getPage(result.page_num);

      const signatureField = await pdf.fieldCreate(uuidv4(), PDFNet.Field.Type.e_signature);
      const signature = await PDFNet.SignatureWidget.createWithField(pdf, rect, signatureField);
      await signature.refreshAppearance();

      page.annotPushBack(signature);
      await replacer.process(page);
    }
    result = await textSearch.run();
  }

  const buffer = await pdf.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
  return encode(buffer.slice().buffer as ArrayBuffer);
};

export const AgreementCreate = () => {
  const viewer = useRef<HTMLDivElement>(null);
  const wvInstance = useRef<WebViewerInstance | null>(null);
  const [form] = Form.useForm();

  const [isWebViewerReady, setIsWebViewerReady] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const dataProvider = useDataProvider();
  const { mutateAsync: createAgreement } = useCreate();
  const { list } = useNavigation();

  const { selectProps: users } = useSelect<BaseRecord & Signer>({
    resource: "users",
    optionLabel: (item) => `${item?.first_name} ${item?.last_name}`,
    optionValue: (item) => String(item.id),
    pagination: { mode: "off" },
  });

  const { selectProps: templates } = useSelect<BaseRecord & Template>({
    resource: "templates",
    optionLabel: (item) => item?.title,
    optionValue: (item) => String(item.id),
    pagination: { mode: "off" },
  });

  const handleOnFinish = async (formData: { user_ids: string[]; template_id: string }) => {
    const wv = wvInstance.current;
    if (!wv) return;

    try {
      await wv.Core.PDFNet.initialize();

      const { data: template } = await dataProvider().getOne<BaseRecord & Template>({
        resource: "templates",
        id: formData.template_id,
      });

      // One agreement per selected signer.
      for (const [index, userId] of formData.user_ids.entries()) {
        setProgress(`Generating agreement ${index + 1} of ${formData.user_ids.length}...`);

        const { data: signer } = await dataProvider().getOne<BaseRecord & Signer>({
          resource: "users",
          id: userId,
        });

        const fileData = await generateAgreement(wv, template.file_data, signer);

        await createAgreement({
          resource: "agreements",
          values: {
            user_id: userId,
            template_id: formData.template_id,
            file_data: fileData,
          },
          successNotification: false,
        });
      }

      list("agreements");
    } catch (error) {
      console.error(error);
      alert("Could not generate the agreement. See the browser console for details.");
    } finally {
      setProgress(null);
    }
  };

  useEffect(() => {
    if (!viewer.current) return;
    // This viewer stays hidden; it only provides the WebViewer engine.
    WebViewer(wvOptions({ fullAPI: true }), viewer.current).then((instance) => {
      wvInstance.current = instance;
      setIsWebViewerReady(true);
    });
  }, []);

  const busy = progress !== null;

  return (
    <Create
      isLoading={busy}
      saveButtonProps={{
        onClick: () => form.submit(),
        disabled: !isWebViewerReady || busy,
        children: "Generate",
      }}
    >
      <Form form={form} onFinish={handleOnFinish} layout="vertical">
        <Flex>
          <Form.Item
            style={{ flex: 1 }}
            label={"Signers"}
            name={"user_ids"}
            extra="Pick more than one to generate several agreements at once."
            rules={[{ required: true }]}
          >
            <Select {...users} mode="multiple" />
          </Form.Item>
          <Form.Item
            style={{ flex: 1, marginLeft: 30 }}
            label={"Template"}
            name={"template_id"}
            rules={[{ required: true }]}
          >
            <Select {...templates} />
          </Form.Item>
        </Flex>
        {progress && <Alert type="info" message={progress} showIcon />}
        <div ref={viewer} style={{ visibility: "hidden", height: 0 }}></div>
      </Form>
    </Create>
  );
};

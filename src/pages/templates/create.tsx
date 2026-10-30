import { Create, useForm } from "@refinedev/antd";
import { Flex, Form } from "antd";
import { useEffect, useRef, useState } from "react";
import WebViewer, { type WebViewerInstance } from "@pdftron/webviewer";
import { encode } from "base64-arraybuffer";
import { wvCardProps } from "../../utility/wv.props";
import { wvOptions } from "../../utility";

export const TemplateCreate = () => {
  const viewer = useRef<HTMLDivElement>(null);
  const wvInstance = useRef<WebViewerInstance | null>(null);
  const { formProps, saveButtonProps, onFinish } = useForm({});
  const [loading, setLoading] = useState(true);

  const handleOnFinish = async () => {
    if (!wvInstance.current) return;
    const { documentViewer } = wvInstance.current.Core;

    // Save whatever is open in the editor as a new template.
    const document = documentViewer.getDocument();
    const title = document.getFilename();
    const fileData = await document.getFileData();
    const base64 = encode(fileData);

    onFinish({
      title: title,
      file_extension: title.split(".").pop(),
      file_data: base64,
    });
  };

  useEffect(() => {
    if (!viewer.current) return;
    WebViewer(
      wvOptions({
        enableOfficeEditing: true,
        enableFilePicker: true,
        initialMode: "docxEditor" as never,
      }),
      viewer.current
    ).then((instance) => {
      wvInstance.current = instance;

      instance.Core.documentViewer.addEventListener("documentLoaded", () => {
        setLoading(false);
      });
    });
  }, []);

  return (
    <Create saveButtonProps={saveButtonProps} contentProps={wvCardProps} isLoading={loading}>
      <Form
        {...formProps}
        onFinish={handleOnFinish}
        layout="vertical"
        style={{ maxHeight: "calc(100vh - 253px)", display: "flex" }}
      >
        <Flex ref={viewer} style={{ flex: 1 }}></Flex>
      </Form>
    </Create>
  );
};

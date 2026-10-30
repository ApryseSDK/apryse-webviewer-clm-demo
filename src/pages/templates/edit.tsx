import { Edit, useForm } from "@refinedev/antd";
import { Flex, Form } from "antd";
import { useEffect, useRef, useState } from "react";
import WebViewer, { type WebViewerInstance } from "@pdftron/webviewer";
import { decode, encode } from "base64-arraybuffer";
import { wvCardProps } from "../../utility/wv.props";
import { wvOptions } from "../../utility";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const TemplateEdit = () => {
  const viewer = useRef<HTMLDivElement>(null);
  const wvInstance = useRef<WebViewerInstance | null>(null);
  const { formProps, saveButtonProps, query, onFinish, formLoading } = useForm({});
  const [isWebViewerReady, setIsWebViewerReady] = useState(false);

  const handleOnFinish = async () => {
    if (!wvInstance.current) return;
    const { documentViewer } = wvInstance.current.Core;

    // Save the edited document back into the template.
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
    if (isWebViewerReady && wvInstance.current) {
      // Name shown on comments and tracked changes made in the editor.
      wvInstance.current.Core.annotationManager.setCurrentUser("Demo User");
    }
  }, [isWebViewerReady]);

  useEffect(() => {
    const template = query?.data?.data;
    if (isWebViewerReady && template && wvInstance.current) {
      const arr = new Uint8Array(decode(template.file_data));
      const blob = new Blob([arr], { type: DOCX_MIME });

      wvInstance.current.UI.loadDocument(blob, {
        enableOfficeEditing: true,
        filename: template.title,
        extension: template.file_extension,
      });
    }
  }, [isWebViewerReady, query?.data?.data]);

  useEffect(() => {
    if (!viewer.current) return;
    WebViewer(
      wvOptions({
        enableOfficeEditing: true,
        enableFilePicker: false,
        initialMode: "docxEditor" as never,
      }),
      viewer.current
    ).then((instance) => {
      wvInstance.current = instance;
      setIsWebViewerReady(true);
    });
  }, []);

  return (
    <Edit saveButtonProps={saveButtonProps} contentProps={wvCardProps} isLoading={formLoading}>
      <Form
        {...formProps}
        onFinish={handleOnFinish}
        layout="vertical"
        style={{ maxHeight: "calc(100vh - 253px)", display: "flex" }}
      >
        <Flex ref={viewer} style={{ flex: 1 }}></Flex>
      </Form>
    </Edit>
  );
};

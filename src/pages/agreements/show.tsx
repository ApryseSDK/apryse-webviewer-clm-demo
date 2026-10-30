import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Flex } from "antd";
import { useEffect, useRef, useState } from "react";
import WebViewer, { type WebViewerInstance } from "@pdftron/webviewer";
import { decode } from "base64-arraybuffer";
import { useOwnerGuard } from "../../components/admin-only";
import { wvCardProps } from "../../utility/wv.props";
import { wvOptions } from "../../utility";

export const AgreementShow = () => {
  const viewer = useRef<HTMLDivElement>(null);
  const wvInstance = useRef<WebViewerInstance | null>(null);
  const [isWebViewerReady, setIsWebViewerReady] = useState(false);

  const {
    result: record,
    query: { isLoading },
  } = useShow({});

  useOwnerGuard(record?.user_id as string | undefined);

  useEffect(() => {
    if (isWebViewerReady && record && wvInstance.current) {
      const blob = new Blob([new Uint8Array(decode(record.file_data))], {
        type: "application/pdf",
      });
      wvInstance.current.UI.loadDocument(blob, { extension: "pdf" });
    }
  }, [record, isWebViewerReady]);

  useEffect(() => {
    if (!viewer.current) return;
    WebViewer(wvOptions({ enableFilePicker: false }), viewer.current).then((instance) => {
      // Read-only: this is the "view" experience for a finished agreement.
      instance.UI.enableViewOnlyMode();
      wvInstance.current = instance;
      setIsWebViewerReady(true);
    });
  }, []);

  return (
    <Show title={"Agreement"} contentProps={wvCardProps} isLoading={isLoading}>
      <Flex style={{ height: "calc(100vh - 253px)", display: "flex" }}>
        <div ref={viewer} style={{ flex: 1 }}></div>
      </Flex>
    </Show>
  );
};

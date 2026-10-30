import { Edit } from "@refinedev/antd";
import { useShow, useUpdate } from "@refinedev/core";
import { Flex } from "antd";
import { useEffect, useRef, useState } from "react";
import WebViewer, { type WebViewerInstance } from "@pdftron/webviewer";
import { decode, encode } from "base64-arraybuffer";
import { useNavigate, useParams } from "react-router";
import { useOwnerGuard } from "../../components/admin-only";
import { useRole } from "../../contexts/role";
import { wvCardProps } from "../../utility/wv.props";
import { wvOptions } from "../../utility";

// The signer's viewer: no editing, annotating, shapes or form tools. Only
// Fill and Sign is left, plus basic navigation (search, zoom, page panel).
const simplifyForSigner = ({ UI }: WebViewerInstance) => {
  UI.disableElements([
    "toolbarGroup-View",
    "toolbarGroup-Annotate",
    "toolbarGroup-Shapes",
    "toolbarGroup-Insert",
    "toolbarGroup-Edit",
    "toolbarGroup-Forms",
    "menuButton",
    "toggleNotesButton",
  ]);
  UI.setToolbarGroup("toolbarGroup-FillAndSign");
};

export const AgreementSign = () => {
  const viewer = useRef<HTMLDivElement>(null);
  const wvInstance = useRef<WebViewerInstance | null>(null);
  const [isWebViewerReady, setIsWebViewerReady] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useRole();

  const {
    query: { data, isLoading },
  } = useShow({
    resource: "agreements",
    id: id,
  });

  useOwnerGuard(data?.data?.user_id as string | undefined);

  const { mutate, mutation } = useUpdate({
    resource: "agreements",
  });

  useEffect(() => {
    if (data && isWebViewerReady && wvInstance.current) {
      const blob = new Blob([new Uint8Array(decode(data.data.file_data))], {
        type: "application/pdf",
      });
      wvInstance.current.UI.loadDocument(blob, { extension: "pdf" });
    }
  }, [data, isWebViewerReady]);

  useEffect(() => {
    if (!viewer.current) return;
    WebViewer(wvOptions({ enableFilePicker: false }), viewer.current).then((instance) => {
      if (!isAdmin) simplifyForSigner(instance);
      wvInstance.current = instance;
      setIsWebViewerReady(true);
    });
    // The viewer is created once per visit; switching roles leaves this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!wvInstance.current || !id) return;
    const { documentViewer, annotationManager } = wvInstance.current.Core;

    // Merge the signature (and any other annotations) into the PDF, then
    // mark the agreement as signed.
    const doc = documentViewer.getDocument();
    const xfdfString = await annotationManager.exportAnnotations();
    const fileData = await doc.getFileData({ xfdfString });

    mutate(
      {
        id: id,
        values: {
          file_data: encode(fileData),
          status: "Signed",
        },
      },
      { onSuccess: () => navigate("/agreements") }
    );
  };

  return (
    <Edit
      title={"Agreement"}
      contentProps={wvCardProps}
      isLoading={isLoading}
      saveButtonProps={{
        onClick: handleSave,
        loading: mutation.isPending,
        children: "Finish signing",
      }}
    >
      <Flex style={{ height: "calc(100vh - 253px)", display: "flex" }}>
        <div ref={viewer} style={{ flex: 1 }}></div>
      </Flex>
    </Edit>
  );
};

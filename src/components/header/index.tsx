import { ReloadOutlined } from "@ant-design/icons";
import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import {
  Button,
  Layout as AntdLayout,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
  theme,
} from "antd";
import React from "react";
import { ADMIN, useRole } from "../../contexts/role";
import { resetDemoData } from "../../data";
import { LICENSE_KEY } from "../../utility";

const { useToken } = theme;

type Signer = { id: string; first_name?: string; last_name?: string };

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { role, setRole } = useRole();
  const { result } = useList<Signer>({ resource: "users", pagination: { mode: "off" } });
  const signers = result?.data ?? [];

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  // If the signer you were viewing as was deleted, show the Admin view.
  const known = role === ADMIN || signers.some((s) => String(s.id) === role);
  const value = known ? role : ADMIN;

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space>
        {!LICENSE_KEY && (
          <Tag color="warning">No license key: WebViewer is in demo mode</Tag>
        )}
        <Typography.Text type="secondary">View as</Typography.Text>
        <Select
          size="small"
          style={{ minWidth: 190 }}
          value={value}
          onChange={setRole}
          options={[
            { value: ADMIN, label: "Admin (full access)" },
            ...signers.map((s) => ({
              value: String(s.id),
              label: `Signer: ${s.first_name} ${s.last_name}`,
            })),
          ]}
        />
        <Popconfirm
          title="Reset demo data?"
          description="This deletes your templates, signers and agreements and restores the sample data."
          okText="Reset"
          onConfirm={resetDemoData}
        >
          <Button size="small" icon={<ReloadOutlined />}>
            Reset demo data
          </Button>
        </Popconfirm>
      </Space>
    </AntdLayout.Header>
  );
};

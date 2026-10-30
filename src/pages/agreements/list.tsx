import { DateField, DeleteButton, List, ShowButton, useTable } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { SignatureOutlined } from "@ant-design/icons";
import { Button, Space, Table, Tag } from "antd";
import { useNavigate } from "react-router";
import { useRole } from "../../contexts/role";
import { removeExtension } from "../../utility";

const AgreementTable = () => {
  const navigate = useNavigate();
  const { isAdmin, role } = useRole();

  // A signer only sees their own agreements.
  const { tableProps } = useTable({
    resource: "agreements",
    syncWithLocation: true,
    filters: {
      permanent: isAdmin ? [] : [{ field: "user_id", operator: "eq", value: role }],
    },
  });

  return (
    <List canCreate={isAdmin}>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          title={"Signer"}
          render={(_, record: BaseRecord) =>
            `${record.users?.first_name} ${record.users?.last_name}`
          }
        />
        <Table.Column
          title={"Agreement"}
          render={(_, record: BaseRecord) => removeExtension(record.templates?.title ?? "")}
        />
        <Table.Column
          title={"Status"}
          dataIndex="status"
          render={(value: string) => (
            <Tag color={value === "Signed" ? "green" : "orange"}>{value}</Tag>
          )}
        />
        <Table.Column
          dataIndex={"created_at"}
          title={"Created Date"}
          render={(value: string) => <DateField value={value} />}
        />
        <Table.Column
          title={"Actions"}
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              {record.status === "Awaiting Signature" && (
                <Button
                  size="small"
                  type="primary"
                  icon={<SignatureOutlined />}
                  onClick={() => navigate(`/agreements/sign/${record.id}`)}
                >
                  Sign
                </Button>
              )}
              <ShowButton hideText size="small" recordItemId={record.id} />
              {isAdmin && <DeleteButton hideText size="small" recordItemId={record.id} />}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

// Keyed by role so the table starts fresh (and refetches) when "View as" changes.
export const AgreementList = () => {
  const { role } = useRole();
  return <AgreementTable key={role} />;
};

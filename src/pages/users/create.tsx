import { Create, useForm } from "@refinedev/antd";
import { Flex, Form, Input } from "antd";

export const UserCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Flex>
          <Form.Item
            style={{ flex: 1 }}
            label={"First name"}
            name={["first_name"]}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            style={{ flex: 1, marginLeft: 30 }}
            label={"Last name"}
            name={["last_name"]}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Flex>
        <Form.Item label={"Email address"} name={["email_address"]}>
          <Input type="email" />
        </Form.Item>
        <Form.Item label={"Address"} name={["address"]} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};

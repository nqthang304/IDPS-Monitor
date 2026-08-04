import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Switch, Flex } from "antd";
import {
  MailOutlined,
  LockOutlined,
  UserAddOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { UserItem } from "../../services/api/user.api";
import styles from "./userModal.module.css";

interface UserModalProps {
  open: boolean;
  editingUser: UserItem | null;
  isUpdating: boolean;
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

const UserModal: React.FC<UserModalProps> = ({
  open,
  editingUser,
  isUpdating,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [formChanged, setFormChanged] = useState(false);
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      if (editingUser) {
        const isEnabled = editingUser.notify !== undefined
          ? editingUser.notify === "enabled"
          : editingUser.notificationEvents !== false;

        const userValues = {
          ...editingUser,
          username: editingUser.username || editingUser.Username,
          fullName: editingUser.fullName || editingUser.UserFullName || editingUser.name,
          email: editingUser.email || editingUser.Email,
          notificationEvents: isEnabled,
          notify: isEnabled ? "enabled" : "disabled",
        };
        setInitialValues(userValues);
        form.setFieldsValue(userValues);
      } else {
        const defaultValues = {
          role: "user",
          notify: "enabled",
          notificationEvents: true,
        };
        setInitialValues(defaultValues);
        form.resetFields();
        form.setFieldsValue(defaultValues);
      }
      setFormChanged(false);
    }
  }, [open, editingUser, form]);

  const checkFormChanged = (_: any, allValues: any) => {
    if (!editingUser) {
      const defaultValues = {
        role: "user",
        notificationEvents: true,
      };

      const isDefault =
        (!allValues.username || allValues.username === "") &&
        (!allValues.fullName || allValues.fullName === "") &&
        (!allValues.email || allValues.email === "") &&
        (!allValues.password || allValues.password === "") &&
        (!allValues.confirmPassword || allValues.confirmPassword === "") &&
        allValues.notificationEvents === defaultValues.notificationEvents;

      setFormChanged(!isDefault);
    } else {
      const keysToCheck = [
        "username",
        "fullName",
        "email",
        "notificationEvents",
        "password",
        "confirmPassword",
      ];

      const changed = keysToCheck.some((key) => {
        if (
          (key === "password" || key === "confirmPassword") &&
          !allValues[key]
        ) {
          return false;
        }

        const initVal = initialValues[key];
        const currVal = allValues[key];

        if (typeof initVal === "boolean" || typeof currVal === "boolean") {
          return Boolean(initVal) !== Boolean(currVal);
        }

        return String(initVal || "") !== String(currVal || "");
      });

      setFormChanged(changed);
    }
  };

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const { notificationEvents, ...rest } = values;
        const notify = notificationEvents ? "enabled" : "disabled";
        onSubmit({
          role: editingUser?.role || "user",
          notify,
          notificationEvents,
          ...rest,
        });
      })
      .catch((info) => {
        console.error("Validation Failed:", info);
      });
  };

  const handleModalClose = () => {
    form.resetFields();
    setFormChanged(false);
    onCancel();
  };

  return (
    <Modal
      className={styles.addUserModal}
      title={editingUser ? "Edit user" : "Add new user"}
      open={open}
      okText={editingUser ? "Save" : "Add"}
      confirmLoading={isUpdating}
      cancelText="Cancel"
      okButtonProps={{ disabled: !formChanged }}
      onCancel={handleModalClose}
      onOk={handleOk}
    >
      <Form
        layout="vertical"
        name="addUserForm"
        form={form}
        onValuesChange={checkFormChanged}
        requiredMark={!editingUser}
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[
            { required: true, message: "Please enter a username" },
            {
              min: 5,
              max: 15,
              message: "Username must be between 5 and 15 characters",
            },
            {
              pattern: /^[A-Za-z0-9]+$/,
              message:
                "Username must not contain Vietnamese characters or special symbols",
            },
          ]}
        >
          <Input
            prefix={<UserAddOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
            disabled={!!editingUser}
          />
        </Form.Item>

        <Form.Item
          label="Full Name"
          name="fullName"
          rules={[{ required: true, message: "Please enter a full name" }]}
        >
          <Input
            prefix={<InfoCircleOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
          />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter an email address" },
            {
              type: "email",
              message: "Please enter a valid email address",
            },
          ]}
        >
          <Input
            prefix={<MailOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
          />
        </Form.Item>

        <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 14, color: "rgba(0, 0, 0, 0.88)" }}>
            Email notification
          </span>
          <Form.Item name="notificationEvents" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </Flex>

        {editingUser ? (
          <>
            <Form.Item
              label="New Password"
              name="password"
              rules={[
                () => ({
                  validator(_, value) {
                    if (!value || value.length >= 8) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Password must be at least 8 characters")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              />
            </Form.Item>
            <Form.Item
              label="Repeat New Password"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The passwords do not match")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter a password" },
                {
                  min: 8,
                  message: "Password must be at least 8 characters",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              />
            </Form.Item>
            <Form.Item
              label="Repeat Password"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please repeat the password" },
                {
                  min: 8,
                  message: "Password must be at least 8 characters",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The passwords do not match")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default UserModal;

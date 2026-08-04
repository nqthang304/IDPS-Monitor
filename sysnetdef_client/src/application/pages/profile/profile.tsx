import React, { useEffect, useState } from "react";
import {
  EditOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Input,
  Row,
  message,
  Space,
  Card,
  Flex,
  Typography,
  Divider,
  Switch,
  Tag,
  Modal,
} from "antd";

const { Title } = Typography;

import Logo from "@/assets/Logo/logo.svg";
import { userApi, type UserItem } from "@/features/modules/management/services/api/user.api";
import { timeFormatter } from "@/utils/formatter.utils";

const Profile: React.FC = () => {
  const [form] = Form.useForm();

  const [disabled, setDisabled] = useState(true);
  const [userData, setUserData] = useState<UserItem | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  const toggle = () => {
    setDisabled(!disabled);
  };

  const handleSwitchChange = (checked: boolean) => {
    setIsEnabled(checked);
  };

  const fetchUserData = async () => {
    try {
      const response = await userApi.getProfile();
      const u = response?.data || (response as any);
      if (!u) {
        message.error("Failed to load user profile data.");
        return;
      }

      const isNotifyEnabled = u.notify !== undefined
        ? u.notify === "enabled"
        : Boolean(u.notificationEvents ?? true);

      const formattedData: UserItem = {
        id: u.id,
        username: u.username || "",
        fullName: u.fullName || u.full_name || u.UserFullName || u.username,
        email: u.email || u.Email || "",
        role: u.role || u.Role || "user",
        notify: isNotifyEnabled ? "enabled" : "disabled",
        notificationEvents: isNotifyEnabled,
        createTime: u.createTime || u.created_date || u.created_at || u.createdAt || "",
      };

      setUserData(formattedData);
      form.setFieldsValue({
        UserFullName: formattedData.fullName,
        Email: formattedData.email,
        notification_events: isNotifyEnabled,
      });
    } catch (error) {
      console.error("Failed to fetch user data: ", error);
      message.error("Failed to load user profile data.");
    }
  };

  const handleUpdateProfile = async (values: any) => {
    Modal.confirm({
      title: "Confirm",
      content: "Are you sure you want to save the changes?",
      onOk: async () => {
        try {
          const isNotifyEnabled = Boolean(values.notification_events);
          const payload: any = {
            fullName: values.UserFullName,
            email: values.Email,
            notify: isNotifyEnabled ? "enabled" : "disabled",
            notificationEvents: isNotifyEnabled,
          };

          if (isEnabled && values.Password) {
            payload.password = values.Password;
          }

          const response = await userApi.updateProfile(payload);
          if (response?.data || response?.success) {
            message.success("Profile updated successfully!");
            await fetchUserData();
            setDisabled(true);
            setIsEnabled(false);
            form.resetFields([
              "CurrentPassword",
              "Password",
              "ConfirmPassword",
            ]);
          }
        } catch (error: any) {
          console.error("Failed to update profile:", error);
          const errorMsg = error?.message || "Failed to update profile";
          message.error(errorMsg);
        }
      },
      onCancel: () => {
        message.info("Changes have not been saved.");
        form.resetFields(["CurrentPassword", "Password", "ConfirmPassword"]);
      },
    });
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box", padding: "16px 24px" }}>
      <Form
        layout="vertical"
        colon={false}
        requiredMark={false}
        form={form}
        onFinish={handleUpdateProfile}
      >
        <Row style={{ width: "100%", margin: 0 }} gutter={[16, 16]}>
          {/* Cột trái: Thông tin Avatar/Logo và thông tin cơ bản */}
          <Col xs={24} sm={6} md={5} lg={4}>
            <Flex
              vertical
              style={{ width: "100%" }}
              align="center"
              justify="center"
              gap={20}
            >
              <div
                style={{
                  width: 128,
                  height: 128,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={Logo}
                  alt="Logo"
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                />
              </div>
              <Space direction="vertical" align="center" size={10}>
                <Tag
                  style={{ marginInlineEnd: 0 }}
                  color={userData?.role?.toLowerCase() === "admin" ? "red" : "green"}
                >
                  {userData?.role?.toUpperCase() ?? "USER"}
                </Tag>
                <Title style={{ marginBottom: 5 }} level={3}>
                  {userData?.fullName ?? userData?.username ?? "N/A"}
                </Title>
                <p style={{ textAlign: "center", color: "#666" }}>
                  Member Since <br /> {userData?.createTime ? timeFormatter(userData.createTime) : "N/A"}
                </p>
              </Space>
            </Flex>
          </Col>

          {/* Cột phải: Form cập nhật thông tin chi tiết */}
          <Col xs={24} sm={18} md={19} lg={20}>
            <Flex vertical style={{ width: "90%" }} gap={20}>
              <Card style={{ borderRadius: 8 }}>
                <Flex justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0 }}>Profile Info</Title>
                  <Button
                    type="primary"
                    icon={disabled ? <EditOutlined /> : <CloseOutlined />}
                    onClick={toggle}
                    danger={!disabled}
                  >
                    {disabled ? "Edit" : "Cancel"}
                  </Button>
                </Flex>

                <Form.Item
                  label={
                    <span style={{ fontSize: "15px", fontWeight: 500 }}>
                      Full Name
                    </span>
                  }
                  layout="vertical"
                  name="UserFullName"
                  rules={[
                    { required: true, message: "Please enter a full name" },
                  ]}
                >
                  <Input
                    size="large"
                    disabled={disabled}
                    prefix={<UserOutlined />}
                  />
                </Form.Item>

                <Divider style={{ borderColor: "#f0f0f0" }} />

                <Title level={4} style={{ margin: "16px 0" }}>Notification</Title>
                <Form.Item
                  label={
                    <span style={{ fontSize: "15px", fontWeight: 500 }}>
                      Email
                    </span>
                  }
                  layout="vertical"
                  name="Email"
                  rules={[
                    { required: true, message: "Please enter an email address" },
                    {
                      type: "email",
                      message: "Please enter a valid email address",
                    },
                  ]}
                >
                  <Input disabled={disabled} prefix={<MailOutlined />} />
                </Form.Item>

                <Form.Item
                  label={
                    <span style={{ fontSize: "15px", fontWeight: 500 }}>
                      Event
                    </span>
                  }
                >
                  <Flex justify="space-between" align="middle" style={{ width: "100%" }}>
                    <span>Email notification</span>
                    <Form.Item name="notification_events" valuePropName="checked" noStyle>
                      <Switch disabled={disabled} />
                    </Form.Item>
                  </Flex>
                </Form.Item>

                <Divider style={{ borderColor: "#f0f0f0" }} />

                <Flex justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0 }}>Update password</Title>
                  <Switch
                    onChange={handleSwitchChange}
                    checked={isEnabled}
                    checkedChildren="Enabled"
                    unCheckedChildren="Disabled"
                    disabled={disabled}
                  />
                </Flex>

                <Form.Item
                  label={
                    <span style={{ fontSize: "15px", fontWeight: 400 }}>
                      New password
                    </span>
                  }
                  layout="vertical"
                  name="Password"
                  rules={[
                    {
                      required: isEnabled,
                      message: "Please enter a new password",
                    },
                    {
                      min: 8,
                      message: "Password must be at least 8 characters",
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    disabled={disabled || !isEnabled}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span style={{ fontSize: "15px", fontWeight: 400 }}>
                      Re-type new password
                    </span>
                  }
                  layout="vertical"
                  name="ConfirmPassword"
                  dependencies={["Password"]}
                  rules={[
                    {
                      required: isEnabled,
                      message: "Please re-type the new password",
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (
                          !isEnabled ||
                          !value ||
                          getFieldValue("Password") === value
                        ) {
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
                    prefix={<LockOutlined />}
                    disabled={disabled || !isEnabled}
                  />
                </Form.Item>

                <Button
                  htmlType="submit"
                  size="large"
                  icon={<CheckOutlined />}
                  disabled={disabled}
                  style={{
                    width: "100%",
                    marginTop: 16,
                    backgroundColor: disabled ? undefined : "#52c41a",
                    borderColor: disabled ? undefined : "#52c41a",
                    color: disabled ? undefined : "#fff",
                  }}
                >
                  Save
                </Button>
              </Card>
            </Flex>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default Profile;

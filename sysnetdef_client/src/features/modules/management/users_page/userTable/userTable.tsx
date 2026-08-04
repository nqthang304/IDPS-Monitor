import React from "react";
import { Table, Tag, Button, Space, Flex, Alert, Card } from "antd";
import type { TableColumnsType } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusSquareOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { FiUsers } from "react-icons/fi";
import type { UserItem } from "../../services/api/user.api";
import { timeFormatter } from "@/utils/formatter.utils";
import styles from "./userTable.module.css";

interface UserTableProps {
  users?: UserItem[];
  isLoading?: boolean;
  error?: string | null;
  onNewUser: () => void;
  onEdit: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users = [],
  isLoading = false,
  error = null,
  onNewUser,
  onEdit,
  onDelete,
}) => {
  const safeUsers = Array.isArray(users) ? users : [];

  const columns: TableColumnsType<UserItem> = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      align: "center",
      render: (_, record) => record.username || record.Username || "",
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "name",
      align: "center",
      render: (_, record) => record.fullName || record.UserFullName || record.name || "",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      align: "center",
      render: (_, record) => {
        const roleVal = record.role || record.Role || "user";
        return (
          <Tag color={roleVal === "admin" ? "red" : "green"}>{roleVal}</Tag>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      align: "center",
      render: (_, record) => {
        const mail = record.email || record.Email || "";
        return mail ? <a href={`mailto:${mail}`}>{mail}</a> : "-";
      },
    },
    {
      title: "Last Login",
      dataIndex: "lastLogin",
      key: "lastLogin",
      align: "center",
      render: (_, record) => {
        const text = record.lastLogin || record.LastLogin;
        return !text ? (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            Never Logged In
          </Tag>
        ) : (
          timeFormatter(text)
        );
      },
    },
    {
      title: "Created Date",
      dataIndex: "createTime",
      key: "createTime",
      align: "center",
      render: (_, record) => {
        const dateVal = record.createTime || record.createdDate || record.createdAt || record.CreatedDate;
        return dateVal ? timeFormatter(dateVal) : "-";
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => {
        const isPrimaryAdmin = record.id === 1 || record.username === "admin";
        return (
          <Space>
            <Button
              type="dashed"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
            {!isPrimaryAdmin && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record)}
              />
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Card>
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: 16, width: "100%" }}
      >
        <Space className={styles.UserManagerHeader} align="center">
          <FiUsers />
          <p>
            <span style={{ color: safeUsers.length >= 6 ? "red" : "inherit" }}>
              {safeUsers.length} / 6
            </span>{" "}
            Users
          </p>
        </Space>
        <Space>
          <Button
            color="green"
            variant="solid"
            icon={<PlusSquareOutlined />}
            onClick={onNewUser}
          >
            New User
          </Button>
        </Space>
      </Flex>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table<UserItem>
        dataSource={safeUsers}
        columns={columns}
        loading={isLoading}
        scroll={{ x: 768 }}
        rowKey={(record) => record.id || record.UserId || record.username}
        pagination={false}
      />
    </Card>
  );
};

export default UserTable;

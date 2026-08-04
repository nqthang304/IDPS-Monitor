import React, { useEffect, useState } from "react";
import { Modal, message } from "antd";
import PageTitle from "@/application/layout/pageTitle/pageTitle";
import UserTable from "@/features/modules/management/users_page/userTable/userTable";
import UserModal from "@/features/modules/management/users_page/userModal/userModal";
import { userApi, type UserItem } from "@/features/modules/management/services/api/user.api";
import styles from "./users.module.css";

const Users: React.FC = () => {
  const [refresh, setRefresh] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addUserModal, setAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [refresh]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userApi.getUsers();
      const userList = Array.isArray(response?.data)
        ? response.data
        : Array.isArray((response as any)?.data?.users)
        ? (response as any).data.users
        : Array.isArray((response as any)?.users)
        ? (response as any).users
        : [];
      setUsers(userList);
    } catch (err: any) {
      setError("Failed to fetch users. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewUserBtn = () => {
    if (users.length >= 6) {
      message.error(
        "Maximum number of users reached, please delete a user to add a new one"
      );
      return;
    }
    setEditingUser(null);
    setAddUserModal(true);
  };

  const handleEdit = (record: UserItem) => {
    setEditingUser(record);
    setAddUserModal(true);
  };

  const handleDelete = (record: UserItem) => {
    if (record.id === 1 || record.username === "admin") {
      message.error("Cannot delete the primary admin user");
      return;
    }

    Modal.confirm({
      title: "Delete User",
      content: `Are you sure you want to delete user ${record.username}?`,
      onOk: async () => {
        try {
          await userApi.deleteUser(record.id);
          message.success("User deleted successfully!");
          setRefresh((prev) => !prev);
        } catch (err: any) {
          message.error(
            err?.message || "Failed to delete user. Please try again."
          );
        }
      },
    });
  };

  const handleCreateOrUpdate = async (values: any) => {
    try {
      setIsUpdating(true);
      if (editingUser) {
        await userApi.updateUser(editingUser.id, values);
        message.success("User updated successfully!");
      } else {
        await userApi.createUser(values);
        message.success("User created successfully!");
      }
      setAddUserModal(false);
      setRefresh((prev) => !prev);
    } catch (err: any) {
      message.error(
        err?.message || "Failed to save user. Please try again."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageTitleWrapper}>
        <PageTitle
          title="User managers"
          description="Manage user accounts and roles for the device"
        />
      </div>
      <UserTable
        users={users}
        isLoading={isLoading}
        error={error}
        onNewUser={handleNewUserBtn}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <UserModal
        open={addUserModal}
        editingUser={editingUser}
        isUpdating={isUpdating}
        onSubmit={handleCreateOrUpdate}
        onCancel={() => setAddUserModal(false)}
      />
    </div>
  );
};

export default Users;

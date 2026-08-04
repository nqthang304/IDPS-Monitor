import React, { useEffect, useState } from "react";
import { ExportOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  Button,
  Modal,
  Table,
  Space,
  Flex,
  Alert,
  Tag,
  message,
  DatePicker,
  Form,
  InputNumber,
} from "antd";
import type { TableColumnsType } from "antd";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { logApi } from "@/features/modules/management/services/api/management.api";
import { timeFormatter } from "@/utils/formatter.utils";

export interface AuditLogItem {
  id: number;
  userId: number;
  username: string;
  time: string;
  action: string;
  status: string;
  result?: string;
  [key: string]: any;
}

const SystemLog: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<AuditLogItem[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<"export" | "delete">("export");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const disabledDate = (current: dayjs.Dayjs) => {
    return current && current.isAfter(dayjs(), "day");
  };

  const disabledDateTime = (current: dayjs.Dayjs) => {
    if (!current) return {};
    const now = dayjs();
    if (current.isSame(now, "day")) {
      return {
        disabledHours: () => Array.from({ length: 24 }, (_, i) => i).filter((h) => h > now.hour()),
        disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i).filter((m) => current.hour() === now.hour() && m > now.minute()),
        disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i).filter((s) => current.hour() === now.hour() && current.minute() === now.minute() && s > now.second()),
      };
    }
    return {};
  };

  const fetchLogs = async (page = pagination.current, limit = pagination.pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const response = await logApi.getAuditLogs({ page, limit });
      const logs = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.logs)
        ? response.data.logs
        : [];
      const total = (response as any)?.pagination?.total ?? (response as any)?.data?.pagination?.total ?? logs.length;
      setDataSource(logs);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: limit,
        total,
      }));
    } catch (err: any) {
      setError("Failed to fetch audit logs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination: any) => {
    fetchLogs(newPagination.current, newPagination.pageSize);
  };

  const handleLimitChange = (newLimit: number) => {
    fetchLogs(1, newLimit);
  };

  useEffect(() => {
    fetchLogs(1, pagination.pageSize);
  }, []);

  const exportToExcel = (logs: AuditLogItem[], fileName = "activity_logs.xlsx") => {
    if (!logs || logs.length === 0) {
      message.error("No logs to export!");
      return;
    }

    const dataToExport = logs.map((log) => ({
      Time: log.time || "",
      Action: log.action || "",
      Username: log.username || "",
      Status: log.status || "",
      Result: log.result || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Activity Logs");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(blob, fileName);
    message.success("Export successful!");
  };

  const handleDownload = () => {
    if (selectedRowKeys.length > 0) {
      const selectedLogs = dataSource.filter((log) => selectedRowKeys.includes(log.id));
      exportToExcel(selectedLogs, "activity_selected_logs.xlsx");
    } else {
      setModalAction("export");
      setModalVisible(true);
    }
  };

  const handleDelete = () => {
    if (selectedRowKeys.length > 0) {
      Modal.confirm({
        title: "Are you sure you want to delete the selected logs?",
        okText: "Yes",
        okType: "danger",
        cancelText: "No",
        onOk: async () => {
          try {
            await logApi.deleteAuditLogsByIds(selectedRowKeys);
            message.success("Logs deleted successfully");
            fetchLogs();
            setSelectedRowKeys([]);
          } catch (err: any) {
            message.error(err?.message || "Failed to delete logs. Please try again later.");
          }
        },
      });
    } else {
      setModalAction("delete");
      setModalVisible(true);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const from = values.range[0];
      const to = values.range[1];

      const fromStr = from.format("YYYY-MM-DD HH:mm:ss");
      const toStr = to.format("YYYY-MM-DD HH:mm:ss");

      if (modalAction === "export") {
        const logsInRange = dataSource.filter((log) => {
          const rawTime = log.time;
          if (!rawTime) return false;
          const formattedTime = rawTime.replace("T", " ").substring(0, 19);
          return formattedTime >= fromStr && formattedTime <= toStr;
        });

        exportToExcel(
          logsInRange,
          `activity_logs_${from.format("YYYYMMDD_HHmmss")}_to_${to.format("YYYYMMDD_HHmmss")}.xlsx`
        );
      } else {
        await logApi.deleteAuditLogsByTimeRange(fromStr, toStr);
        message.success("Logs deleted successfully");
        fetchLogs();
        setSelectedRowKeys([]);
      }
      setModalVisible(false);
      form.resetFields();
    } catch (err) {
      message.error("Please select a valid date range.");
    }
  };

  const columns: TableColumnsType<AuditLogItem> = [
    {
      key: "time",
      title: "Time",
      dataIndex: "time",
      render: (_, record) => (record.time ? timeFormatter(record.time) : ""),
      sorter: (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
      sortDirections: ["descend", "ascend"],
      width: "20%",
    },
    {
      key: "action",
      title: "Action",
      dataIndex: "action",
      render: (_, record) => record.action || "",
      width: "20%",
    },
    {
      key: "username",
      title: "Username",
      dataIndex: "username",
      render: (_, record) => record.username || "",
      width: "20%",
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      width: "15%",
      render: (_, record) => {
        const statusVal = record.status || "";
        return (
          <Tag color={statusVal === "SUCCESS" || statusVal === "Success" ? "green" : "red"}>
            {statusVal}
          </Tag>
        );
      },
      filters: [
        { text: "SUCCESS", value: "SUCCESS" },
        { text: "FAILED", value: "FAILED" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      key: "result",
      title: "Result",
      dataIndex: "result",
      render: (_, record) => record.result || "",
      width: "25%",
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <Flex vertical gap={15}>
      <Space>
        <Button type="primary" onClick={handleDownload} icon={<ExportOutlined />}>
          Export Activity
        </Button>
        <Button danger onClick={handleDelete} icon={<DeleteOutlined />}>
          Delete
        </Button>
      </Space>
      {error && <Alert message={error} type="error" showIcon />}
      <Table<AuditLogItem>
        loading={loading}
        columns={columns}
        rowSelection={rowSelection}
        expandable={{
          expandedRowRender: (record) => (
            <span
              style={{
                margin: 0,
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {record.result || "No additional detail"}
            </span>
          ),
          rowExpandable: (record) => !!record.result,
        }}
        dataSource={dataSource}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          position: ["bottomRight"],
          size: "small",
          showTotal: (total) => (
            <Space style={{ marginRight: 24 }}>
              <span>Total {total} items</span>
              <span style={{ color: "#ccc" }}>|</span>
              <span>Limit:</span>
              <InputNumber
                size="small"
                min={1}
                max={1000}
                placeholder="Input limit"
                style={{ width: "70px" }}
                onPressEnter={(e: any) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) {
                    handleLimitChange(val);
                  }
                }}
              />
            </Space>
          ),
        }}
        onChange={handleTableChange}
      />
      <Modal
        title={
          modalAction === "export"
            ? "Export Activity logs by time range"
            : "Delete Activity logs by time range"
        }
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText={modalAction === "export" ? "Export" : "Delete"}
        okButtonProps={modalAction === "delete" ? { danger: true } : undefined}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Select time range"
            name="range"
            rules={[
              { required: true, message: "Please select a date range" },
              () => ({
                validator(_, value) {
                  if (!value || value.length < 2) return Promise.resolve();
                  const [start, end] = value;
                  if (start && end && start.isAfter(end)) {
                    return Promise.reject(
                      new Error("Start date & time cannot be greater than end date & time")
                    );
                  }
                  if (end && end.isAfter(dayjs())) {
                    return Promise.reject(
                      new Error("End date & time cannot be in the future")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker.RangePicker
              showTime={{ format: "HH:mm:ss" }}
              format="YYYY/MM/DD HH:mm:ss"
              disabledDate={disabledDate}
              disabledTime={disabledDateTime}
              allowClear={false}
              style={{ width: "100%" }}
              placeholder={["Start date & time", "End date & time"]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  );
};

export default SystemLog;

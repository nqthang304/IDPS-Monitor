import LogTableContainer from "@/features/modules/management/logs_page/logTableContainer/logTableContainer";

const DeviceLogs = () => {
  const configs = [
    { key: 'config', label: 'Config activity', data: [] },
    { key: 'system', label: 'System activity', data: [] },
  ];
  return <LogTableContainer tabs={configs} />;
};

export default DeviceLogs;
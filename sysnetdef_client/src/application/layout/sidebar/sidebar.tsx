import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Modal } from 'antd';
import { DashboardOutlined, EyeOutlined, SafetyOutlined, ControlOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import styles from './sidebar.module.css';
import logo_white from '@/assets/icon/logo_white.svg';
import { useSocket } from '@/system/providers/socket.providers';

const { Sider } = Layout;

const HoverInlineSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const location = useLocation();
  const { disconnectSocket } = useSocket();

  // --- CƠ CHẾ MAP PATH TO KEY MỚI (Dựa trên cấu trúc Menu TypeScript) ---
  const selectedKey = useMemo(() => {
    const path = location.pathname;

    if (path === "/" || path === "/dashboard") return "/dashboard";
    if (path === "/rules") return "/rules";
    if (path === "/analyze") return "/analyze";
    if (path === "/management/logs" || path === "/management") return "/management/logs";
    if (path === "/management/users") return "/management/users";
    if (path === "/profile") return "/profile";

    return "";
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const handleSiderMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setCollapsed(false);
  };

  const handleSiderMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setCollapsed(true);
      setOpenKeys([]);
    }, 40);
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "Logout",
      content: "Are you sure you want to logout?",
      onOk: () => {
        localStorage.removeItem('access_token');
        disconnectSocket();
        window.location.href = '/login';
      },
    });
  };

  const onOpenChange = (keys: string[]) => {
    // Accordion mode: Mở 1 đóng các cái khác
    const latestOpenKey = keys.find(key => openKeys.indexOf(key) === -1);
    if (latestOpenKey) {
      setOpenKeys([latestOpenKey]);
    } else {
      setOpenKeys([]);
    }
  };

  // Cấu trúc menu theo router mới
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">DASHBOARD</Link>,
      onClick: () => setOpenKeys([]),
    },
    {
      key: '/rules',
      icon: <EyeOutlined />,
      label: <Link to="/rules">RULES MANAGEMENT</Link>,
      onClick: () => setOpenKeys([]),
    },
    {
      key: '/analyze',
      icon: <SafetyOutlined />,
      label: <Link to="/analyze">ANALYZE</Link>,
      onClick: () => setOpenKeys([]),
    },
    {
      key: 'management',
      icon: <ControlOutlined />,
      label: 'MANAGEMENT',
      children: [
        { key: '/management/logs', label: <Link to="/management/logs">Logs</Link> },
        { key: '/management/users', label: <Link to="/management/users">Users</Link> },
      ],
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">PROFILE</Link>,
      onClick: () => setOpenKeys([]),
    },
  ];

  return (
    <Sider
      theme="dark"
      collapsed={collapsed}
      trigger={null}
      onMouseEnter={handleSiderMouseEnter}
      onMouseLeave={handleSiderMouseLeave}
      className={`${styles.siderContainer} ${collapsed ? styles.isCollapsed : ''}`}
      style={{
        height: '100vh',
        // TỐI ƯU HIỆU NĂNG SỐ 2: Ép chạy trên GPU và giới hạn vùng ảnh hưởng Render
        willChange: 'width',
        contain: 'layout',
        boxShadow: collapsed ? 'none' : '4px 0 10px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        <div className={styles.logoWrapper}>
          <img src={logo_white} alt="Logo" className={styles.logo} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Menu
            theme="dark"
            mode="inline"
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            selectedKeys={[selectedKey]} // Sử dụng selectedKey từ useMemo
            style={{ borderRight: 0 }}
            items={menuItems}
          // TỐI ƯU HIỆU NĂNG SỐ 3: Ngắt hẳn Animation trượt dọc của Antd khi Sidebar thu gọn
          // motion={collapsed ? { motionAppear: false, motionEnter: false, motionLeave: false } : undefined}
          />
        </div>

        <div style={{ paddingBottom: '16px' }}>
          <Menu
            theme="dark"
            mode="inline"
            selectable={false}
            items={[
              {
                key: '/login',
                icon: <LogoutOutlined />,
                // Gán sự kiện Logout vào Modal
                label: <span onClick={handleLogout} style={{ cursor: 'pointer' }}>LOGOUT</span>,
              },
            ]}
          />
        </div>

      </div>
    </Sider>
  );
};

export default HoverInlineSidebar;
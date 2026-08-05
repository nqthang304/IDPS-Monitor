import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button } from 'antd';

const ActionUIConfig: Record<string, { route: string; label: string }> = {
  IDPS_CONDITION_UPDATE: { route: '/dashboard', label: 'IDPS Status/Mode' },
  IDPS_RULES_UPDATE: { route: '/rules', label: 'IDPS Rules' },
  IPSEC_PROFILE_UPDATE: { route: '/ipsec/list-ipsec-profile', label: 'IPSec Profiles' },
};

// Key duy nhất để điều khiển việc ghi đè thông báo
const ASYNC_PROCESS_KEY = 'async_notification_key';

const NotificationHandler: React.FC = () => {
  const navigate = useNavigate();
  const { notification, modal } = App.useApp();

  useEffect(() => {
    // --------------------------------------------------------
    // 1. HANDLER CHO SOCKET (Thông báo kết quả cuối cùng)
    // --------------------------------------------------------
    const handleSocketNotification = (event: any) => {
      const { actionID, status, message } = event.detail;
      const config = ActionUIConfig[actionID];
      const actionLabel = config ? config.label : actionID;
      const isInitiator = sessionStorage.getItem('is_initiator') === 'true';

      // Trường hợp: Hệ thống bận (503) hoặc Lỗi (500)
      if (status === 503 || status === 500) {
        notification[status === 500 ? 'error' : 'warning']({
          key: ASYNC_PROCESS_KEY, // Ghi đè lên thông báo 202 cũ
          message: status === 500 ? 'Device error' : 'System busy',
          description: message || `Process "${actionLabel}" failed.`,
          placement: 'bottomRight',
          duration: 4.5, // Tự tắt sau khi báo lỗi
        });

        if (isInitiator) sessionStorage.removeItem('is_initiator');
        return;
      }

      // Trường hợp: Thành công (200)
      if (status === 200) {
        if (isInitiator) {
          // Nếu là người gửi lệnh, đóng thông báo cũ và hiện Modal thành công
          notification.destroy(ASYNC_PROCESS_KEY);
          const instance = modal.success({
            title: 'Update successful',
            content: message || `Configuration for ${actionLabel} has been applied.`,
            okText: 'View changes',
            cancelText: 'Stay here',
            okCancel: true,
            onOk: () => {
              if (config) navigate(config.route);
            },
          });
          sessionStorage.removeItem('is_initiator');

          setTimeout(() => {
            instance.destroy();
          }, 5000);
        } else {
          // Nếu là người dùng khác, update thông báo thành công
          notification.success({
            key: ASYNC_PROCESS_KEY,
            message: 'System updated',
            description: `Another user just updated: ${actionLabel}`,
            placement: 'bottomRight',
            duration: 4.5,
            btn: config ? (
              <Button
                type="default"
                size="small"
                onClick={() => {
                  navigate(config.route);
                  notification.destroy(ASYNC_PROCESS_KEY);
                }}
              >
                View changes
              </Button>
            ) : null,
          });
        }
      }
    };

    // --------------------------------------------------------
    // 2. HANDLER CHO API AXIOS (Dựa vào currentAction)
    // --------------------------------------------------------
    const handleApiNotification = (event: any) => {
      const { type, message, status, currentAction } = event.detail;
      const config = currentAction ? ActionUIConfig[currentAction] : null;
      const actionLabel = config ? config.label : (currentAction || 'Process');

      // Trường hợp 202: Đang xử lý -> Hiển thị và treo thông báo (duration: 0)
      if (status === 202) {
        notification.info({
          key: ASYNC_PROCESS_KEY, // Đặt key để Socket có thể ghi đè
          message: `Processing: ${actionLabel}`,
          description: message || 'The device is applying the new configuration. Please wait...',
          duration: 0, // Không tự ẩn
          placement: 'bottomRight',
        });
        return;
      }

      // Các trường hợp lỗi API khác (CANCELLED, 503 tại chỗ, v.v.)
      const notifyType = type as 'success' | 'error' | 'warning' | 'info';
      let displayMessage = message;
      let displayTitle = type.charAt(0).toUpperCase() + type.slice(1);

      if ((status === 503 || status === 'CANCELLED') && currentAction) {
        displayTitle = 'System busy';
        displayMessage = `Process "${actionLabel}" is being processed by another user.`;
      }

      notification[notifyType]({
        key: ASYNC_PROCESS_KEY,
        message: displayTitle,
        description: displayMessage,
        placement: 'bottomRight',
        duration: 4.5,
        btn: config ? (
          <Button
            type="default"
            size="small"
            onClick={() => {
              navigate(config.route);
              notification.destroy(ASYNC_PROCESS_KEY);
            }}
          >
            View changes
          </Button>
        ) : null,
      });
    };

    window.addEventListener('SYS_NOTIFY_RECEIVED', handleSocketNotification);
    window.addEventListener('API_NOTIFY', handleApiNotification);

    return () => {
      window.removeEventListener('SYS_NOTIFY_RECEIVED', handleSocketNotification);
      window.removeEventListener('API_NOTIFY', handleApiNotification);
    };
  }, [navigate, notification, modal]);

  return null;
};

export default NotificationHandler;
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import { router } from './system/routes';
import { SocketProvider } from './system/providers/socket.providers';
import { useResponsiveFont } from '@/hooks/useResponsiveFont';
import { getThemeConfig } from '@/theme/themeConfig'; // Import cấu hình
import { logger } from './utils/logger.utils';

logger.info('APP', `Initializing GUI Firewall Client v2`);
logger.debug('APP', `Environment Mode: ${import.meta.env.VITE_ENV}`);

function App() {
  const dynamicFontSize = useResponsiveFont();

  return (
    <ConfigProvider theme={getThemeConfig(dynamicFontSize)}>
      <AntdApp>
        <SocketProvider>
            <RouterProvider router={router} />
        </SocketProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
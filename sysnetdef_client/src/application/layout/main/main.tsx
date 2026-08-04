import styles from './main.module.css';
import HoverSidebarWithLinks from '../sidebar/sidebar';
import { Outlet, useNavigation } from 'react-router-dom';
import NotificationHandler from '@/application/layout/notificationHandler/notificationHandler';
import Header from '../header/header';
import { Spin } from 'antd';

const Main = () => {
    const navigation = useNavigation();

    // Biến này sẽ trả về true khi một router con đang gọi loader
    const isPageLoading = navigation.state === "loading";
    
    return (
        <div className={styles.main}>
            <div className={styles.sidebar}>
                <HoverSidebarWithLinks />
            </div>
            <div className={styles.mainContent}>
                <Header />
                {isPageLoading ? (
                    <div className={styles.loaderOverlay}>
                        <Spin size="large" description="Loading..." />
                    </div>
                ) : (
                    <Outlet />
                )}
                
                <NotificationHandler />
            </div>
        </div>
    );
};

export default Main;
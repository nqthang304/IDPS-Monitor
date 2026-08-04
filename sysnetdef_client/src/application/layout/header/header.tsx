// components/header/Header.jsx
import { useLocation, Link } from 'react-router-dom';
import styles from './header.module.css';
import logo from '@/assets/Logo/ACS_Logo.svg';

const Header = () => {
    const location = useLocation();

    // 1. Định nghĩa từ điển để chuyển đổi tên URL sang tên hiển thị
    const breadcrumbNameMap : Record<string, string> ={
        'dashboard': 'Dashboard',
        'overview': 'Overview',
        'ddos': 'Anti - DDoS',
        'ipsec': 'IPSec - VPN',
        'idps': 'IDPS',
        'rules': 'Rules management',
        'analyze': 'Analyze',
        'anti-ddos': 'Anti - DDoS',
        'management': 'Management',
        'ip-security-setting': 'IPSec setting',
        'list-ipsec-profile': 'IPSec profiles',
        'port-mirroring': 'Port mirroring',
        'net-working': 'Network working',
        'defense-profiles': 'Defense profiles',
        'list-profile': 'List profile',
        'profile-config': 'Profile config',
        'list-user': 'List users',
        'create-profile': 'Create profile',

    };

    // Tách path: "/idps/rules" -> ["idps", "rules"]
    const pathnames = location.pathname.split('/').filter((x) => x);

    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                <nav className={styles.breadcrumbs}>
                    {/* <Link to="/">Home</Link> */}
                    {pathnames.map((value, index) => {
                        const last = index === pathnames.length - 1;
                        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                        const displayName = breadcrumbNameMap[value] || 
                            (value.charAt(0).toUpperCase() + value.slice(1));

                        return (
                            <span key={to}>
                                
                                {last ? (
                                    <span className={styles.current}>{displayName}</span>
                                ) : (
                                    <Link to={to}>{displayName}</Link>
                                )}
                                {!last && <span className={styles.separator}>/</span>}
                            </span>
                        );
                    })}
                </nav>
            </div>

            <div className={styles.rightSection}>
                <div className={styles.logo}>
                    <img src={logo} alt="Logo" />
                </div>
            </div>
        </header>
    );
};

export default Header;
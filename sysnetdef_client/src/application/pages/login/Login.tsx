import React from 'react';
import { LoginForm } from '@/features/modules/auth/LoginForm_page/LoginForm'; 
import styles from './Login.module.css';
import logo_login from '@/assets/logo/ACS_Logo_white.svg';

const Login: React.FC = () => {
  return (
    <div className={styles.loginPage}>
      <div className={styles.loginBox}>
        
        {/* Phần Header của form đăng nhập */}
        <div className={styles.header}>
          <div className={styles.imgWrapper}>
            <img src={logo_login} alt="ACS Logo" className={styles.logo} />
          </div>
        </div>
        
        {/* Form đăng nhập */}
        <LoginForm />
        
      </div>
    </div>
  );
};

export default Login;
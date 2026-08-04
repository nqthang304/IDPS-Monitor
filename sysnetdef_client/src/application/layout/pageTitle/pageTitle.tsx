import React from 'react';
import styles from './PageTitle.module.css';

// Định nghĩa cấu trúc dữ liệu đầu vào (Props)
interface PageTitleProps {
  title: string;           
  description?: string;     
  style?: React.CSSProperties; 
}

const PageTitle: React.FC<PageTitleProps> = ({ title, description, style }) => {
  return (
    <div className={styles.pageTitle} style={style}>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
};

export default PageTitle;
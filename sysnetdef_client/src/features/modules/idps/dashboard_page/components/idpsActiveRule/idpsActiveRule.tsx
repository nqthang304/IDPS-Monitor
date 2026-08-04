import React, { useEffect, useState } from 'react';
import styles from './idpsActiveRule.module.css';
import { SafetyCertificateFilled } from '@ant-design/icons';
import { idpsApi } from '../../../services/api/idps.api';

// interface IdpsActiveRuleProps {
//     activeRuleCount: number;
// }

const IdpsActiveRule: React.FC = () => {
    const [activeRuleCount, setActiveRuleCount] = useState(0);
    const fetchActiveRuleCount = async () => {
        try {
            const res = await idpsApi.getIdpsActiveRuleCount();
            console.log("IDPS Active Rule Count Response:", res);
            setActiveRuleCount(res.count);
        } catch (error) {
            console.error("Lỗi lấy active rule count:", error);
        }
    };

    useEffect(() => {
        fetchActiveRuleCount();
    }, []);


    return (
        <div className={styles.activeRuleCard}>
            <h3 className={styles.title}>Active rules</h3>
            <div className={styles.valueContainer}>
                <span>
                    <SafetyCertificateFilled className={styles.icon} />
                </span>
                <span className={styles.value} title={activeRuleCount.toLocaleString()}>
                    {activeRuleCount.toLocaleString()}
                </span>
            </div>
        </div>
    );
};

export default IdpsActiveRule;
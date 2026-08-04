import React, { useState, useEffect } from 'react';
import { DatePicker, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import styles from './timeSelectModal.module.css';

const { RangePicker } = DatePicker;

interface Props {
    isModalOpen: boolean;
    onAnalyze: (dates: [string, string]) => void;
}

const TimeSelectModal: React.FC<Props> = ({ isModalOpen, onAnalyze }) => {
    const [dates, setDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);

    // Reset lại ngày mỗi khi Modal mở ra hoặc đóng lại (thay thế cho destroyOnHidden)
    useEffect(() => {
        if (isModalOpen) {
            setDates([dayjs().subtract(7, 'day'), dayjs()]);
        } else {
            setDates(null);
        }
    }, [isModalOpen]);

    const handleAnalyze = () => {
        if (dates && dates[0] && dates[1]) {
            const dateStrings: [string, string] = [
                dates[0].format('YYYY-MM-DD HH:mm:ss'),
                dates[1].format('YYYY-MM-DD HH:mm:ss'),
            ];
            onAnalyze(dateStrings);
        } else {
            alert("Vui lòng chọn khoảng thời gian!");
        }
    };

    // Nếu isModalOpen = false thì không render gì cả
    if (!isModalOpen) return null;

    return (
        /* Lớp phủ (Mask) toàn màn hình */
        <div className={styles.overlay} >
            
            <div 
                className={styles.modalContent} 
                onClick={(e) => e.stopPropagation()} // Ngăn việc click vào nội dung làm đóng Modal
            >
                <div className={styles.container}>
                    <h2 className={styles.title}>Select the time range for traffic analysis</h2>

                    <RangePicker
                        showTime
                        format="YYYY-MM-DD HH:mm:ss"
                        className={styles.rangePicker}
                        value={dates}
                        onChange={(values) => setDates(values as any)}
                    />

                    <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        className={styles.analyzeBtn}
                        onClick={handleAnalyze}
                    >
                        Analyze
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TimeSelectModal;
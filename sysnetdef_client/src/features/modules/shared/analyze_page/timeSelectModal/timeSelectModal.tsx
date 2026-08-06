import React, { useState, useEffect } from 'react';
import { DatePicker, Button, message } from 'antd';
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

    // Không cho phép chọn ngày lớn hơn ngày hiện tại
    const disabledDate = (current: dayjs.Dayjs) => {
        return current && current.isAfter(dayjs(), 'day');
    };

    // Không cho phép chọn giờ/phút/giây trong tương lai nếu là ngày hôm nay
    const disabledDateTime = (current: dayjs.Dayjs) => {
        if (!current) return {};
        const now = dayjs();
        if (current.isSame(now, 'day')) {
            return {
                disabledHours: () => Array.from({ length: 24 }, (_, i) => i).filter((h) => h > now.hour()),
                disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i).filter((m) => current.hour() === now.hour() && m > now.minute()),
                disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i).filter((s) => current.hour() === now.hour() && current.minute() === now.minute() && s > now.second()),
            };
        }
        return {};
    };

    const handleAnalyze = () => {
        if (dates && dates[0] && dates[1]) {
            let start = dates[0];
            let end = dates[1];

            // Nếu thời gian bắt đầu lớn hơn thời gian kết thúc -> Tráo đổi
            if (start.isAfter(end)) {
                const temp = start;
                start = end;
                end = temp;
            }

            // Đảm bảo thời gian không vượt quá thời điểm hiện tại
            const now = dayjs();
            if (start.isAfter(now)) start = now;
            if (end.isAfter(now)) end = now;

            const dateStrings: [string, string] = [
                start.format('YYYY-MM-DD HH:mm:ss'),
                end.format('YYYY-MM-DD HH:mm:ss'),
            ];
            onAnalyze(dateStrings);
        } else {
            message.warning("Vui lòng chọn khoảng thời gian!");
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
                        showTime={{
                            format: 'HH:mm:ss',
                            disabledTime: disabledDateTime,
                        }}
                        disabledDate={disabledDate}
                        format="YYYY-MM-DD HH:mm:ss"
                        className={styles.rangePicker}
                        value={dates}
                        onChange={(values) => {
                            if (values && values[0] && values[1]) {
                                let [start, end] = values;
                                if (start && end && start.isAfter(end)) {
                                    setDates([end, start]);
                                } else {
                                    setDates(values as any);
                                }
                            } else {
                                setDates(values as any);
                            }
                        }}
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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '@/features/modules/auth/services/api/auth.api';
import { useSocket } from '@/system/providers/socket.providers';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { connectSocket } = useSocket();
  // Tự động chạy khi user điền đủ thông tin và bấm Submit
  const onFinish = async (values: any) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await authApi.login(values);
      if (response.success && response.data) {
        localStorage.setItem('access_token', response.data.token);
        connectSocket(response.data.token);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Verification failed!');
      }
    } catch (err) {
      setError('Lost connection to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      name="cyber_login"
      layout="vertical"
      onFinish={onFinish}
      size="large"
    >

      <Form.Item
        name="username"
        rules={[{ required: true, message: 'Please enter your username!' }]}
      >
        <Input
          prefix={<UserOutlined style={{ color: '#595959' }} />}
          placeholder="Enter your username"
          autoComplete="username"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please enter your password!' }]}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#595959' }} />}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </Form.Item>

      {/* Hiển thị lỗi nếu sai tài khoản/mật khẩu */}
      {error && (
        <Form.Item>
          <Alert message={error} type="error" showIcon />
        </Form.Item>
      )}

      <Form.Item style={{ marginTop: 10, marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={isLoading}
        >
          Login
        </Button>
      </Form.Item>
    </Form>
  );
};
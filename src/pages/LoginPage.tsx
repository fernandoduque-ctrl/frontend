import { App, Button, Form, Input } from '@/ds';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ACTIVE_COMPANY_ID_KEY, TOKEN_KEY } from '@/constants/storageKeys';
import { login } from '@/services/auth.service';
import { api, unwrap } from '@/services/api';

export function LoginPage() {
  const { message } = App.useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string })?.from || '/dashboard';

  return (
    <AuthLayout>
      <Form
        layout="vertical"
        onFinish={async (v) => {
          try {
            const res = await login(v.email, v.password);
            localStorage.setItem(TOKEN_KEY, res.accessToken);
            if (res.user.companyId) {
              localStorage.setItem(ACTIVE_COMPANY_ID_KEY, res.user.companyId);
            } else if (res.user.role === 'ADMIN' || res.user.role === 'CONSULTANT') {
              localStorage.removeItem(ACTIVE_COMPANY_ID_KEY);
              try {
                const raw = await api.get('/companies/list');
                const companies = unwrap(raw) as { id: string }[];
                if (companies.length === 1) {
                  localStorage.setItem(ACTIVE_COMPANY_ID_KEY, companies[0].id);
                }
              } catch {
                /* lista só para perfis internos */
              }
            } else {
              localStorage.removeItem(ACTIVE_COMPANY_ID_KEY);
            }
            message.success(`Olá, ${res.user.name}`);
            nav(from, { replace: true });
          } catch {
            message.error('Credenciais inválidas');
          }
        }}
      >
        <Form.Item label="E-mail" name="email" rules={[{ required: true, type: 'email' }]}>
          <Input autoComplete="email" placeholder="admin@folhasolid.com" />
        </Form.Item>
        <Form.Item label="Senha" name="password" rules={[{ required: true }]}>
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large">
          Entrar
        </Button>
      </Form>
    </AuthLayout>
  );
}

import {
  Layout,
  Menu,
  Button,
  Typography,
  Space,
  Breadcrumb,
  theme,
} from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  UploadOutlined,
  LogoutOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ACTIVE_COMPANY_ID_KEY, TOKEN_KEY } from '@/constants/storageKeys';
import { api, unwrap } from '@/services/api';

const { Header, Sider, Content } = Layout;

type SettingsPayload = { data: Record<string, unknown> };

export function AppShell() {
  const nav = useNavigate();
  const loc = useLocation();
  const { token } = theme.useToken();
  const { data: settingsRes } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => unwrap(await api.get('/settings')) as SettingsPayload,
  });
  /** Preferência global salva em `/settings`; ausência ou `true` = menu escuro (comportamento anterior). */
  const darkSidebar = settingsRes?.data?.darkSidebar !== false;

  const selected = loc.pathname.startsWith('/wizard')
    ? ['/wizard']
    : [loc.pathname === '/' ? '/dashboard' : loc.pathname];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={0} width={240} theme={darkSidebar ? 'dark' : 'light'}>
        <div
          style={{
            padding: '16px 16px 14px',
            borderBottom: darkSidebar
              ? '1px solid rgba(255,255,255,0.08)'
              : `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <img
            src="/images/logo.svg"
            alt="Sólides"
            width={103}
            height={24}
            style={{ display: 'block', marginBottom: 10, maxWidth: '100%', height: '1.75rem', width: 'auto' }}
          />
          <Typography.Text
            strong
            style={{
              display: 'block',
              fontSize: 13,
              color: darkSidebar ? 'rgba(255,255,255,0.92)' : token.colorPrimary,
              letterSpacing: '-0.02em',
            }}
          >
            Folha Digital
          </Typography.Text>
        </div>
        <Menu
          theme={darkSidebar ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={selected}
          items={[
            { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard', onClick: () => nav('/dashboard') },
            { key: '/wizard', icon: <ApartmentOutlined />, label: 'Wizard', onClick: () => nav('/wizard') },
            { key: '/uploads', icon: <UploadOutlined />, label: 'Uploads', onClick: () => nav('/uploads') },
            { key: '/settings', icon: <SettingOutlined />, label: 'Configurações', onClick: () => nav('/settings') },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Breadcrumb
            items={loc.pathname.split('/').filter(Boolean).map((s, i, arr) => ({
              title: s,
              key: arr.slice(0, i + 1).join('/'),
            }))}
          />
          <Space>
            <Typography.Text type="secondary">Corporativo</Typography.Text>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={() => {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(ACTIVE_COMPANY_ID_KEY);
                nav('/login');
              }}
            >
              Sair
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

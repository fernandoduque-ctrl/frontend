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
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ACTIVE_COMPANY_ID_KEY, TOKEN_KEY } from '@/constants/storageKeys';

const { Header, Sider, Content } = Layout;

export function AppShell() {
  const nav = useNavigate();
  const loc = useLocation();
  const { token } = theme.useToken();

  const selected = loc.pathname.startsWith('/wizard')
    ? ['/wizard']
    : [loc.pathname === '/' ? '/dashboard' : loc.pathname];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={0} width={240} theme="dark">
        <div
          style={{
            padding: '20px 16px',
            fontWeight: 700,
            color: '#fff',
            fontSize: 15,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Sólides Folha
        </div>
        <Menu
          theme="dark"
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

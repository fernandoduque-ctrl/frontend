import { Card, Typography, theme } from 'antd';
import { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: token.colorBgLayout,
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: `0 8px 32px rgba(112, 38, 112, 0.08)`,
          borderColor: token.colorBorder,
        }}
      >
        <img
          src="/images/logo.svg"
          alt="Sólides"
          width={103}
          height={24}
          style={{ display: 'block', marginBottom: 16 }}
        />
        <Typography.Title level={3} style={{ marginTop: 0, color: token.colorPrimary, fontWeight: 700 }}>
          Folha Digital Sólides
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Wizard de parametrização — acesso administrativo
        </Typography.Paragraph>
        {children}
      </Card>
    </div>
  );
}

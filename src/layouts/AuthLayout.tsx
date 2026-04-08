import { Card, Typography } from 'antd';
import { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #0f3d3e 0%, #1a5f61 45%, #0a2a2b 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
        <Typography.Title level={3} style={{ marginTop: 0, color: '#0f3d3e' }}>
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

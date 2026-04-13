import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Typography, Button, List, Tag, Progress, Space } from '@/ds';
import { useNavigate } from 'react-router-dom';
import { api, unwrap } from '@/services/api';
import type { DashboardSummary } from '@/types/apiResponses';

export function DashboardPage() {
  const nav = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dash'],
    queryFn: async () => unwrap<DashboardSummary>(await api.get('/dashboard/summary')),
  });

  if (isLoading || !data) {
    return <Typography.Text>Carregando…</Typography.Text>;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Empresa atual">
            <Typography.Title level={4} style={{ marginTop: 0 }}>
              {data.company?.clientDisplayName}
            </Typography.Title>
            <Typography.Paragraph type="secondary" ellipsis>
              {data.company?.legalName}
            </Typography.Paragraph>
            <Tag>{data.company?.onboardingStatus}</Tag>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Progresso do onboarding">
            <Progress type="dashboard" percent={data.onboardingPercent} />
            <Button type="primary" style={{ marginTop: 16 }} onClick={() => nav('/wizard')}>
              Continuar parametrização
            </Button>
          </Card>
        </Col>
      </Row>
      <Typography.Title level={5}>Etapas</Typography.Title>
      <Row gutter={[16, 16]}>
        {(data.stages || []).map((s) => (
            <Col xs={24} sm={12} lg={8} key={s.stageNumber}>
              <Card
                size="small"
                title={`Etapa ${s.stageNumber}`}
                extra={<Tag>{s.status}</Tag>}
                hoverable
                onClick={() => nav(`/wizard/etapa-${s.stageNumber}`)}
              >
                <Typography.Text ellipsis>{s.title}</Typography.Text>
                <Progress percent={s.stepProgress} size="small" />
              </Card>
            </Col>
          ),
        )}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Pendências" size="small">
            <List
              size="small"
              dataSource={data.pendencias || []}
              locale={{ emptyText: 'Nenhuma pendência' }}
              renderItem={(item: string) => <List.Item>{item}</List.Item>}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Uploads recentes" size="small">
            <List
              size="small"
              dataSource={data.recentUploads || []}
              renderItem={(u: { originalName: string; category: string }) => (
                <List.Item>
                  {u.originalName} <Tag>{u.category}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

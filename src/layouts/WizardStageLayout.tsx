import { Card, Col, Progress, Row, Steps, Typography, Tag, theme } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { STAGE_META, stagePath } from '@/constants/stageMeta';

export function WizardStageLayout() {
  const loc = useLocation();
  const m = /\/wizard\/etapa-(\d+)/.exec(loc.pathname);
  const stage = m ? parseInt(m[1], 10) : 1;
  const meta = STAGE_META[stage];
  const nav = useNavigate();
  const { token } = theme.useToken();

  if (!meta) {
    return <Typography.Text type="danger">Etapa inválida</Typography.Text>;
  }

  const base = `/wizard/${stagePath(stage)}`;
  const current = loc.pathname.replace(/.*\/wizard\/etapa-\d+\//, '') || 'passo-1';
  const idx = Math.max(
    0,
    meta.steps.findIndex((s) => s.path === current),
  );
  const pct = Math.round(((idx + 1) / meta.steps.length) * 100);

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={7}>
        <Card
          title={
            <span>
              Etapa {stage} de 6 <Tag color="blue">{meta.eta}</Tag>
            </span>
          }
          style={{ position: 'sticky', top: 24 }}
        >
          <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
            {meta.subtitle}
          </Typography.Paragraph>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            Tempo estimado: {meta.eta} · passos curtos com ajuda contextual nos campos
          </Typography.Text>
          <Progress percent={pct} strokeColor={token.colorPrimary} style={{ marginBottom: 16 }} />
          <Steps
            direction="vertical"
            size="small"
            current={idx}
            items={meta.steps.map((s) => ({
              title: s.label,
              onClick: () => nav(`${base}/${s.path}`),
              style: { cursor: 'pointer' },
            }))}
          />
        </Card>
      </Col>
      <Col xs={24} lg={17}>
        <Card
          title={
            <span>
              {meta.title}
              <Typography.Text type="secondary" style={{ fontSize: 14, fontWeight: 400, marginLeft: 8 }}>
                · Folha Digital Sólides
              </Typography.Text>
            </span>
          }
        >
          <Outlet context={{ stage }} />
        </Card>
      </Col>
    </Row>
  );
}

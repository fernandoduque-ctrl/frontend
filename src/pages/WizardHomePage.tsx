import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Typography, Button, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api, unwrap } from '@/services/api';
import { QK_WIZARD_ETAPAS_LISTA, WIZARD_ETAPA_META, wizardEtapaPath } from '@/constants/wizardEtapaMeta';

export function WizardHomePage() {
  const nav = useNavigate();
  const { data: stages } = useQuery({
    queryKey: QK_WIZARD_ETAPAS_LISTA,
    queryFn: async () => unwrap(await api.get('/wizard/etapas')),
  });

  return (
    <div>
      <Typography.Title level={3}>Wizard de parametrização — Folha Digital Sólides</Typography.Title>
      <Typography.Paragraph type="secondary">
        Fluxo guiado em 6 etapas: identificação da empresa, estrutura operacional da folha, base histórica, benefícios,
        rubricas e importação eSocial com staging e confirmação (simulada neste MVP).
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4, 5, 6].map((n) => {
          const meta = WIZARD_ETAPA_META[n];
          const st = stages?.find((x: { stageNumber: number }) => x.stageNumber === n);
          return (
            <Col xs={24} md={12} lg={8} key={n}>
              <Card
                title={`Etapa ${n}`}
                extra={st && <Tag>{st.status}</Tag>}
                actions={[
                  <Button type="link" key="go" onClick={() => nav(`/wizard/${wizardEtapaPath(n)}`)}>
                    Abrir
                  </Button>,
                ]}
              >
                <Typography.Text strong>{meta.title}</Typography.Text>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {meta.subtitle}
                </Typography.Paragraph>
                <Tag>{meta.eta}</Tag>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

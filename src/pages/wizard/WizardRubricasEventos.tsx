import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  Upload,
  App,
} from '@/ds';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, unwrap } from '@/services/api';
import { slugToBackendStepNumber } from '@/utils/wizardSteps';
import { uploadBlob } from './uploadBlob';

type PayrollRubricRow = {
  id: string;
  code: string;
  name: string;
  rubricType: string;
  incidenceINSS?: boolean;
  incidenceFGTS?: boolean;
  incidenceIRRF?: boolean;
  incidenceESocial?: boolean;
  defaultCostCenterId?: string | null;
  defaultDepartmentId?: string | null;
};

export function WizardRubricasEventos({ slug }: { slug: string }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [rubCsv, setRubCsv] = useState('');
  const [rubOpen, setRubOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<PayrollRubricRow | null>(null);
  const [newRubForm] = Form.useForm();
  const [editRubForm] = Form.useForm();

  const { data: rub } = useQuery({
    queryKey: ['rubrics'],
    queryFn: async () => unwrap(await api.get('/payroll-rubrics')) as PayrollRubricRow[],
  });

  const { data: ccList } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: async () => unwrap(await api.get('/cost-centers')) as { id: string; code: string; name: string }[],
    enabled: slug === 'passo-2',
  });

  const { data: deptList } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => unwrap(await api.get('/departments')) as { id: string; code: string; name: string }[],
    enabled: slug === 'passo-2',
  });

  const tryComplete5 = async () => {
    const n = slugToBackendStepNumber(5, slug);
    if (!n) return;
    try {
      await api.post(`/wizard/passos/5/${n}/complete`, {});
    } catch {
      /* seed antigo */
    }
  };

  const ccOptions =
    ccList?.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })) ?? [];
  const deptOptions =
    deptList?.map((d) => ({ value: d.id, label: `${d.code} — ${d.name}` })) ?? [];

  if (slug === 'passo-1') {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button
          type="primary"
          onClick={() => {
            newRubForm.resetFields();
            setRubOpen(true);
          }}
        >
          Nova rubrica
        </Button>
        <Table
          size="small"
          dataSource={rub || []}
          rowKey="id"
          columns={[
            { title: 'Código', dataIndex: 'code' },
            { title: 'Nome', dataIndex: 'name' },
            { title: 'Tipo', dataIndex: 'rubricType' },
          ]}
        />
        <Modal title="Nova rubrica" open={rubOpen} onCancel={() => setRubOpen(false)} footer={null}>
          <Form
            form={newRubForm}
            layout="vertical"
            onFinish={async (v) => {
              await api.post('/payroll-rubrics', {
                code: String(v.code).trim(),
                name: v.name,
                rubricType: v.rubricType,
              });
              message.success('Rubrica criada');
              setRubOpen(false);
              newRubForm.resetFields();
              qc.invalidateQueries({ queryKey: ['rubrics'] });
              await tryComplete5();
            }}
          >
            <Form.Item name="code" label="Código" rules={[{ required: true }]}>
              <Input placeholder="Ex.: VR" />
            </Form.Item>
            <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="rubricType" label="Tipo" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'EARNING', label: 'Provento' },
                  { value: 'DEDUCTION', label: 'Desconto' },
                  { value: 'INFORMATIVE', label: 'Informativo' },
                ]}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Criar
            </Button>
          </Form>
        </Modal>
      </Space>
    );
  }
  if (slug === 'passo-2') {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          Marque incidências (INSS, FGTS, IRRF, eSocial) e, se quiser, CC e departamento padrão da rubrica.
        </Typography.Paragraph>
        <Table
          size="small"
          dataSource={rub || []}
          rowKey="id"
          columns={[
            { title: 'Código', dataIndex: 'code' },
            { title: 'Nome', dataIndex: 'name' },
            { title: 'Tipo', dataIndex: 'rubricType' },
            {
              title: '',
              key: 'edit',
              width: 140,
              render: (_: unknown, r: PayrollRubricRow) => (
                <Button
                  size="small"
                  type="link"
                  onClick={() => {
                    setEditingRubric(r);
                    editRubForm.setFieldsValue({
                      incidenceINSS: r.incidenceINSS ?? false,
                      incidenceFGTS: r.incidenceFGTS ?? false,
                      incidenceIRRF: r.incidenceIRRF ?? false,
                      incidenceESocial: r.incidenceESocial ?? false,
                      defaultCostCenterId: r.defaultCostCenterId ?? undefined,
                      defaultDepartmentId: r.defaultDepartmentId ?? undefined,
                    });
                    setEditOpen(true);
                  }}
                >
                  Incidências / CC
                </Button>
              ),
            },
          ]}
        />
        <Modal
          title={editingRubric ? `Rubrica ${editingRubric.code}` : 'Rubrica'}
          open={editOpen}
          onCancel={() => {
            setEditOpen(false);
            setEditingRubric(null);
          }}
          footer={null}
        >
          <Form
            form={editRubForm}
            layout="vertical"
            onFinish={async (v) => {
              if (!editingRubric) return;
              await api.put(`/payroll-rubrics/${editingRubric.id}`, {
                code: editingRubric.code,
                name: editingRubric.name,
                rubricType: editingRubric.rubricType,
                incidenceINSS: !!v.incidenceINSS,
                incidenceFGTS: !!v.incidenceFGTS,
                incidenceIRRF: !!v.incidenceIRRF,
                incidenceESocial: !!v.incidenceESocial,
                defaultCostCenterId: v.defaultCostCenterId || undefined,
                defaultDepartmentId: v.defaultDepartmentId || undefined,
              });
              message.success('Rubrica atualizada');
              setEditOpen(false);
              setEditingRubric(null);
              qc.invalidateQueries({ queryKey: ['rubrics'] });
              await tryComplete5();
            }}
          >
            <Form.Item name="incidenceINSS" valuePropName="checked">
              <Checkbox>Incide INSS</Checkbox>
            </Form.Item>
            <Form.Item name="incidenceFGTS" valuePropName="checked">
              <Checkbox>Incide FGTS</Checkbox>
            </Form.Item>
            <Form.Item name="incidenceIRRF" valuePropName="checked">
              <Checkbox>Incide IRRF</Checkbox>
            </Form.Item>
            <Form.Item name="incidenceESocial" valuePropName="checked">
              <Checkbox>Incide eSocial</Checkbox>
            </Form.Item>
            <Form.Item name="defaultCostCenterId" label="Centro de custo padrão">
              <Select allowClear options={ccOptions} placeholder="Opcional" showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="defaultDepartmentId" label="Departamento padrão">
              <Select allowClear options={deptOptions} placeholder="Opcional" showSearch optionFilterProp="label" />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Salvar
            </Button>
          </Form>
        </Modal>
      </Space>
    );
  }
  if (slug === 'passo-3') {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Upload
          beforeUpload={async (file) => {
            await uploadBlob(file, 'RUBRICS_SPREADSHEET');
            message.success('Planilha arquivada');
            return false;
          }}
        >
          <Button>Upload planilha (arquivo)</Button>
        </Upload>
        <Typography.Paragraph type="secondary">
          CSV (codigo;nome;tipo): use EARNING (provento), DEDUCTION (desconto) ou INFORMATIVO (INFORMATIVE).
        </Typography.Paragraph>
        <Input.TextArea
          rows={8}
          value={rubCsv}
          onChange={(e) => setRubCsv(e.target.value)}
          placeholder={'VR;Vale refeição;EARNING\nVT;Vale transporte;DEDUCTION'}
        />
        <Button
          type="primary"
          onClick={async () => {
            const rows: { code: string; name: string; rubricType: string }[] = [];
            for (const line of rubCsv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
              const p = line.split(';').map((x) => x.trim());
              if (p.length < 3) continue;
              rows.push({ code: p[0], name: p[1], rubricType: p[2].toUpperCase() });
            }
            if (!rows.length) {
              message.warning('Nenhuma linha válida');
              return;
            }
            const r = unwrap(await api.post('/payroll-rubrics/import', { rows })) as {
              created: unknown[];
              skipped: string[];
            };
            message.success(`Importadas: ${r.created?.length ?? 0} · Ignoradas (código existente): ${r.skipped?.join(', ') || '—'}`);
            setRubCsv('');
            qc.invalidateQueries({ queryKey: ['rubrics'] });
            await tryComplete5();
          }}
        >
          Importar linhas CSV
        </Button>
      </Space>
    );
  }
  if (slug === 'resumo') {
    const n = rub?.length ?? 0;
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Title level={5}>Checklist — rubricas e eventos</Typography.Title>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>{n > 0 ? '✔' : '—'} Rubricas cadastradas ou importadas ({n})</li>
          <li>Revise incidências e CC/depto padrão (passos 2 e desta etapa)</li>
        </ul>
        <Alert
          type="info"
          showIcon
          message="Ligação com a etapa 6 (eSocial)"
          description="Rubricas mapeadas aqui aparecem nas conferências de importação (ex.: rubricas não mapeadas na pré-visualização do lote)."
        />
        <Alert
          type="success"
          showIcon
          message="Resultado técnico após aprovação da etapa 5"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Eventos da folha alinhados a incidências (INSS, FGTS, IRRF, eSocial) e CC/depto padrão;</li>
              <li>Base pronta para cruzar com retornos do eSocial na etapa 6 e reduzir inconsistências na folha.</li>
            </ul>
          }
        />
        <Space wrap>
          <Button onClick={() => nav('/wizard/etapa-5/passo-1')}>✏️ Lista de rubricas</Button>
          <Button onClick={() => nav('/wizard/etapa-5/passo-2')}>✏️ Incidências e CC</Button>
        </Space>
        <Space wrap>
          <Button
            type="primary"
            onClick={() => api.post('/wizard/etapas/5/submit', {}).then(() => message.success('Enviado'))}
          >
            📤 Enviar etapa 5 para validação
          </Button>
          <Button onClick={() => nav('/wizard/etapa-6')}>⏭️ Avançar para etapa 6 (importação eSocial)</Button>
        </Space>
      </Space>
    );
  }
  return <Typography.Text>Ajuste incidências e CC/dept padrão via PUT /payroll-rubrics/:id</Typography.Text>;
}

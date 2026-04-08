import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Typography,
  Upload,
  App,
} from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadOutlined } from '@ant-design/icons';
import { api, unwrap } from '@/services/api';
import { slugToBackendStepNumber } from '@/utils/wizardSteps';
import { maskCnpj, onlyDigits } from '@/utils/brForm';

const BENEFIT_TYPE_LABELS: Record<string, string> = {
  MEAL_VOUCHER: 'Vale refeição',
  FOOD_VOUCHER: 'Vale alimentação',
  TRANSPORT_VOUCHER: 'Vale transporte',
  HEALTH_PLAN: 'Plano de saúde',
  LIFE_INSURANCE: 'Seguro de vida',
  OTHER: 'Outro',
};

type BenefitRow = {
  id: string;
  type: string;
  internalName: string;
  paymentRuleType: string;
  companyPercentage?: number | null;
  employeePercentage?: number | null;
  hasDependents?: boolean;
  dependentCompanyPercentage?: number | null;
  dependentEmployeePercentage?: number | null;
  valueType: string;
  defaultValue?: number | null;
  transportDiscountPercent?: number | null;
  understoodAck?: boolean;
  isActive?: boolean;
};

export function Stage4({ slug }: { slug: string }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [ruleForm] = Form.useForm();
  const [valForm] = Form.useForm();
  const [supForm] = Form.useForm();
  const [vtForm] = Form.useForm();
  const [createBenefitForm] = Form.useForm();
  const [layoutSupplierId, setLayoutSupplierId] = useState<string | undefined>();

  const { data: benefits } = useQuery({
    queryKey: ['benefits'],
    queryFn: async () => unwrap(await api.get('/benefits')) as BenefitRow[],
    enabled: slug.startsWith('passo') || slug === 'resumo',
  });
  const { data: suppliers } = useQuery({
    queryKey: ['benefit-suppliers'],
    queryFn: async () => unwrap(await api.get('/benefit-suppliers')),
    enabled: slug === 'passo-6' || slug === 'resumo',
  });

  const tryComplete = async () => {
    const n = slugToBackendStepNumber(4, slug);
    if (!n) return;
    try {
      await api.post(`/wizard/steps/4/${n}/complete`, {});
    } catch {
      /* seed antigo */
    }
  };

  const benefitOptions =
    benefits?.map((b) => ({
      value: b.id,
      label: `${b.internalName} (${BENEFIT_TYPE_LABELS[b.type] ?? b.type})`,
    })) ?? [];

  const findBenefit = (id: string) => benefits?.find((b) => b.id === id);

  const putBenefitMerge = async (b: BenefitRow, patch: Record<string, unknown>) => {
    const paymentRuleType = (patch.paymentRuleType ?? b.paymentRuleType) as string;
    const split = paymentRuleType === 'SPLIT_PERCENT';
    const hasDependents = (patch.hasDependents ?? b.hasDependents) === true;
    await api.put(`/benefits/${b.id}`, {
      type: b.type,
      internalName: b.internalName,
      paymentRuleType,
      companyPercentage: split
        ? Number(patch.companyPercentage ?? b.companyPercentage ?? 0)
        : null,
      employeePercentage: split
        ? Number(patch.employeePercentage ?? b.employeePercentage ?? 0)
        : null,
      hasDependents,
      dependentCompanyPercentage: hasDependents
        ? Number(patch.dependentCompanyPercentage ?? b.dependentCompanyPercentage ?? 0)
        : null,
      dependentEmployeePercentage: hasDependents
        ? Number(patch.dependentEmployeePercentage ?? b.dependentEmployeePercentage ?? 0)
        : null,
      valueType: (patch.valueType ?? b.valueType) as string,
      defaultValue:
        patch.defaultValue !== undefined ? Number(patch.defaultValue) : b.defaultValue ?? undefined,
      transportDiscountPercent:
        patch.transportDiscountPercent !== undefined
          ? Number(patch.transportDiscountPercent)
          : b.transportDiscountPercent ?? undefined,
      understoodAck: b.understoodAck ?? true,
      isActive: b.isActive ?? true,
    });
  };

  if (slug === 'passo-1') {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Etapa 4 — Parametrização de benefícios">
          <Typography.Paragraph>Nesta etapa você irá:</Typography.Paragraph>
          <ul style={{ marginTop: 0 }}>
            <li>Criar os benefícios no sistema;</li>
            <li>Definir regras de pagamento e desconto;</li>
            <li>Informar valores e fornecedores (e layouts quando aplicável).</li>
          </ul>
          <Typography.Paragraph>
            Cadastre <strong>tipos</strong> de benefícios, regras de cálculo, valores e fornecedores. Nesta etapa não há
            associação a colaboradores.
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary">
            Mensagem guiada: o vínculo benefício × colaborador será feito após a importação dos dados do eSocial; aí você
            poderá ajustar valores individuais quando aplicável.
          </Typography.Paragraph>
          <Button type="primary" size="large" onClick={() => nav('/wizard/etapa-4/passo-2')}>
            ➡️ Iniciar etapa 4
          </Button>
        </Card>
        <Alert
          type="info"
          showIcon
          message="Dependências"
          description="Etapas 1 (empresa), 2 (estrutura da folha) e 3 (base histórica) validadas no fluxo. Tempo estimado: 20–30 min · parametrização técnica com validação final do consultor Sólides."
        />
        <Alert
          type="warning"
          showIcon
          message="Sem vínculo com colaboradores aqui"
          description="Configure apenas a estrutura e as regras; a distribuição por funcionário vem depois do eSocial."
        />
      </Space>
    );
  }
  if (slug === 'passo-2') {
    const types = [
      'MEAL_VOUCHER',
      'FOOD_VOUCHER',
      'TRANSPORT_VOUCHER',
      'HEALTH_PLAN',
      'LIFE_INSURANCE',
      'OTHER',
    ] as const;
    const tableRows = types.map((t) => ({
      key: t,
      beneficio: BENEFIT_TYPE_LABELS[t] ?? t,
      status: benefits?.some((b) => b.type === t) ? 'Configurado' : 'Não configurado',
    }));
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space wrap>
          <Button type="primary" onClick={() => nav('/wizard/etapa-4/passo-3')}>
            Adicionar novo benefício
          </Button>
        </Space>
        <Table
          size="small"
          pagination={false}
          columns={[
            { title: 'Benefício', dataIndex: 'beneficio' },
            { title: 'Status', dataIndex: 'status' },
          ]}
          dataSource={tableRows}
        />
        <Row gutter={[16, 16]}>
          {types.map((t) => {
            const ok = benefits?.some((b) => b.type === t);
            return (
              <Col span={12} key={t}>
                <Card size="small" title={BENEFIT_TYPE_LABELS[t] ?? t}>
                  <Typography.Text type={ok ? 'success' : 'secondary'}>
                    {ok ? 'Configurado' : 'Não configurado'}
                  </Typography.Text>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Space>
    );
  }
  if (slug === 'passo-3') {
    return (
      <Card title="Dados do benefício" style={{ maxWidth: 560 }}>
      <Form
        form={createBenefitForm}
        layout="vertical"
        style={{ maxWidth: 480 }}
        onFinish={async (v) => {
          await api.post('/benefits', {
            type: v.type,
            internalName: v.internalName,
            paymentRuleType: 'COMPANY_100',
            valueType: v.valueType,
            defaultValue: Number(v.defaultValue) || 0,
            understoodAck: true,
            hasDependents: false,
          });
          message.success('Benefício cadastrado');
          createBenefitForm.resetFields();
          qc.invalidateQueries({ queryKey: ['benefits'] });
          await tryComplete();
        }}
      >
        <Form.Item name="type" label="Tipo de benefício" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'MEAL_VOUCHER', label: 'Vale refeição' },
              { value: 'FOOD_VOUCHER', label: 'Vale alimentação' },
              { value: 'TRANSPORT_VOUCHER', label: 'Vale transporte' },
              { value: 'HEALTH_PLAN', label: 'Plano saúde' },
              { value: 'LIFE_INSURANCE', label: 'Seguro de vida' },
              { value: 'OTHER', label: 'Outro (nome livre no campo abaixo)' },
            ]}
          />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
          {() =>
            createBenefitForm.getFieldValue('type') === 'OTHER' ? (
              <Alert
                style={{ marginBottom: 12 }}
                type="info"
                showIcon
                message="Outro benefício"
                description="Use o nome interno para descrever o benefício (ex.: Auxílio creche, Auxílio educação). Esse nome aparece na folha e relatórios."
              />
            ) : null
          }
        </Form.Item>
        <Form.Item
          name="internalName"
          label="Nome interno do benefício"
          rules={[{ required: true }]}
          extra="Ex.: Vale refeição — padrão mensal"
        >
          <Input />
        </Form.Item>
        <Form.Item name="valueType" label="Tipo de valor" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'DAILY', label: 'Diário (ex.: R$ 35,00 por dia)' },
              { value: 'MONTHLY_FIXED', label: 'Mensal fixo (ex.: R$ 500,00/mês)' },
            ]}
          />
        </Form.Item>
        <Form.Item name="defaultValue" label="Valor padrão (R$)">
          <Input type="number" step="0.01" />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Salvar benefício
        </Button>
      </Form>
      </Card>
    );
  }
  if (slug === 'passo-4') {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          showIcon
          type="info"
          message="Regras de cálculo"
          description="100% empresa ou colaborador, ou rateio titular (SPLIT_PERCENT) somando 100%. Com dependentes, informe também o rateio para dependentes."
        />
        <Form
          form={ruleForm}
          layout="vertical"
          style={{ maxWidth: 520 }}
          onFinish={async (v) => {
            const b = findBenefit(v.benefitId);
            if (!b) {
              message.warning('Selecione um benefício');
              return;
            }
            const split = v.paymentRuleType === 'SPLIT_PERCENT';
            await putBenefitMerge(b, {
              paymentRuleType: v.paymentRuleType,
              companyPercentage: split ? Number(v.companyPercentage) : undefined,
              employeePercentage: split ? Number(v.employeePercentage) : undefined,
              hasDependents: !!v.hasDependents,
              dependentCompanyPercentage:
                v.hasDependents ? Number(v.dependentCompanyPercentage) : undefined,
              dependentEmployeePercentage:
                v.hasDependents ? Number(v.dependentEmployeePercentage) : undefined,
            });
            message.success('Regras atualizadas');
            qc.invalidateQueries({ queryKey: ['benefits'] });
            await tryComplete();
          }}
        >
          <Form.Item name="benefitId" label="Benefício" rules={[{ required: true }]}>
            <Select
              options={benefitOptions}
              placeholder="Selecione"
              showSearch
              optionFilterProp="label"
              onChange={(id) => {
                const b = findBenefit(id as string);
                if (!b) return;
                ruleForm.setFieldsValue({
                  paymentRuleType: b.paymentRuleType,
                  companyPercentage: b.companyPercentage ?? 50,
                  employeePercentage: b.employeePercentage ?? 50,
                  hasDependents: b.hasDependents ?? false,
                  dependentCompanyPercentage: b.dependentCompanyPercentage ?? 50,
                  dependentEmployeePercentage: b.dependentEmployeePercentage ?? 50,
                });
              }}
            />
          </Form.Item>
          <Form.Item name="paymentRuleType" label="Quem paga (titular)" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'COMPANY_100', label: '100% empresa' },
                { value: 'EMPLOYEE_100', label: '100% colaborador' },
                { value: 'SPLIT_PERCENT', label: 'Rateio % (titular)' },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.paymentRuleType !== c.paymentRuleType}>
            {() =>
              ruleForm.getFieldValue('paymentRuleType') === 'SPLIT_PERCENT' ? (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="companyPercentage"
                      label="% Empresa"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="employeePercentage"
                      label="% Colaborador"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null
            }
          </Form.Item>
          <Form.Item name="hasDependents" label="Há cobertura / rateio para dependentes?" valuePropName="checked">
            <Checkbox />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.hasDependents !== c.hasDependents}>
            {() =>
              ruleForm.getFieldValue('hasDependents') ? (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="dependentCompanyPercentage"
                      label="% Empresa (dependentes)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="dependentEmployeePercentage"
                      label="% Colaborador (dependentes)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null
            }
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Salvar regras
          </Button>
        </Form>
      </Space>
    );
  }
  if (slug === 'passo-5') {
    return (
      <Form
        form={valForm}
        layout="vertical"
        style={{ maxWidth: 480 }}
        onFinish={async (v) => {
          const b = findBenefit(v.benefitId);
          if (!b) {
            message.warning('Selecione um benefício');
            return;
          }
          await putBenefitMerge(b, {
            valueType: v.valueType,
            defaultValue: Number(v.defaultValue) || 0,
          });
          message.success('Valores atualizados');
          qc.invalidateQueries({ queryKey: ['benefits'] });
          await tryComplete();
        }}
      >
        <Form.Item name="benefitId" label="Benefício" rules={[{ required: true }]}>
          <Select
            options={benefitOptions}
            showSearch
            optionFilterProp="label"
            onChange={(id) => {
              const b = findBenefit(id as string);
              if (!b) return;
              valForm.setFieldsValue({
                valueType: b.valueType,
                defaultValue: b.defaultValue ?? 0,
              });
            }}
          />
        </Form.Item>
        <Form.Item name="valueType" label="Tipo de valor" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'DAILY', label: 'Diário' },
              { value: 'MONTHLY_FIXED', label: 'Mensal fixo' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="defaultValue"
          label="Valor padrão (R$)"
          rules={[{ required: true }]}
          extra="Ex.: R$ 35,00 por dia (diário) ou R$ 500,00 mensal (fixo)."
        >
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0,00" />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Salvar valores
        </Button>
      </Form>
    );
  }
  if (slug === 'passo-6') {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          Fornecedores vinculados aos benefícios (layout / convênio). CNPJ opcional; será validado se informado.
        </Typography.Text>
        <Form
          form={supForm}
          layout="vertical"
          style={{ maxWidth: 480 }}
          onFinish={async (v) => {
            await api.post('/benefit-suppliers', {
              benefitId: v.benefitId,
              name: v.name,
              taxId: v.taxId ? onlyDigits(String(v.taxId)) : undefined,
              isPrimary: !!v.isPrimary,
            });
            message.success('Fornecedor cadastrado');
            supForm.resetFields(['name', 'taxId', 'isPrimary']);
            qc.invalidateQueries({ queryKey: ['benefit-suppliers'] });
            await tryComplete();
          }}
        >
          <Form.Item name="benefitId" label="Benefício" rules={[{ required: true }]}>
            <Select options={benefitOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="name" label="Nome do fornecedor" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="taxId" label="CNPJ">
            <Input
              placeholder="00.000.000/0000-00"
              onChange={(e) => {
                const m = maskCnpj(e.target.value);
                supForm.setFieldValue('taxId', m);
              }}
            />
          </Form.Item>
          <Form.Item name="isPrimary" valuePropName="checked" initialValue={false}>
            <Checkbox>Fornecedor principal deste benefício</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Cadastrar fornecedor
          </Button>
        </Form>
        <Table
          size="small"
          rowKey="id"
          dataSource={suppliers || []}
          columns={[
            {
              title: 'Benefício',
              key: 'b',
              render: (_: unknown, r: { benefit?: { internalName?: string } }) =>
                r.benefit?.internalName ?? '—',
            },
            { title: 'Nome', dataIndex: 'name' },
            { title: 'CNPJ', dataIndex: 'taxId' },
            {
              title: 'Principal',
              dataIndex: 'isPrimary',
              render: (v: boolean) => (v ? 'Sim' : '—'),
            },
          ]}
        />
        <Card size="small" title="Layout do fornecedor (CSV / XLS / PDF)">
          <Typography.Paragraph type="secondary">
            Um benefício pode ter <strong>um fornecedor principal</strong> e <strong>vários secundários</strong>. Anexe
            o layout do convênio quando aplicável.
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Exemplos de referência: <Typography.Text code>layout Alelo</Typography.Text> ·{' '}
            <Typography.Text code>layout Caju</Typography.Text> (nomes ilustrativos; use o arquivo do seu operador).
          </Typography.Paragraph>
          <Select
            allowClear
            placeholder="Selecione o fornecedor já cadastrado"
            style={{ width: '100%', maxWidth: 400, marginBottom: 12 }}
            value={layoutSupplierId}
            onChange={(v) => setLayoutSupplierId(v)}
            options={(suppliers as { id: string; name: string; benefit?: { internalName?: string } }[] | undefined)?.map(
              (s) => ({
                value: s.id,
                label: `${s.name}${s.benefit?.internalName ? ` — ${s.benefit.internalName}` : ''}`,
              }),
            )}
          />
          <Upload
            disabled={!layoutSupplierId}
            beforeUpload={async (file) => {
              if (!layoutSupplierId) return false;
              const fd = new FormData();
              fd.append('file', file);
              await api.post(`/benefit-suppliers/${layoutSupplierId}/layout-file`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              message.success('Layout anexado ao fornecedor');
              qc.invalidateQueries({ queryKey: ['benefit-suppliers'] });
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} disabled={!layoutSupplierId}>
              Enviar arquivo de layout
            </Button>
          </Upload>
        </Card>
      </Space>
    );
  }
  if (slug === 'passo-7') {
    const vtOptions =
      benefits?.filter((b) => b.type === 'TRANSPORT_VOUCHER').map((b) => ({
        value: b.id,
        label: b.internalName,
      })) ?? [];
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          type="warning"
          showIcon
          message="VT e desconto legal"
          description="Neste fluxo o desconto é limitado a 6% (referência CLT art. 58 §3º). Percentuais diferentes por colaborador entram após o eSocial."
        />
        <Form
          form={vtForm}
          layout="vertical"
          style={{ maxWidth: 400 }}
          onFinish={async (v) => {
            const b = findBenefit(v.benefitId);
            if (!b || b.type !== 'TRANSPORT_VOUCHER') {
              message.error('Selecione um benefício do tipo vale transporte.');
              return;
            }
            const p = Number(v.transportDiscountPercent);
            if (p > 6) {
              message.error('Máximo 6% de desconto permitido aqui.');
              return;
            }
            await putBenefitMerge(b, { transportDiscountPercent: p });
            message.success('Percentual de VT salvo');
            qc.invalidateQueries({ queryKey: ['benefits'] });
            await tryComplete();
          }}
        >
          <Form.Item name="benefitId" label="Vale transporte" rules={[{ required: true }]}>
            <Select
              options={vtOptions}
              placeholder={vtOptions.length ? 'Selecione' : 'Cadastre um VT no passo 3'}
              onChange={(id) => {
                const b = findBenefit(id as string);
                if (b) {
                  vtForm.setFieldsValue({
                    transportDiscountPercent: b.transportDiscountPercent ?? 6,
                  });
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="transportDiscountPercent"
            label="% desconto em folha (máx. 6)"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} max={6} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Salvar
          </Button>
        </Form>
      </Space>
    );
  }
  if (slug === 'passo-8') {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Vinculação com colaboradores — confirmação">
          <Typography.Paragraph>
            Nesta etapa, os benefícios <strong>não</strong> são associados a funcionários.
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary">Após a importação dos dados do eSocial, você poderá:</Typography.Paragraph>
          <ul>
            <li>Vincular benefícios por colaborador;</li>
            <li>Ajustar valores individuais quando aplicável;</li>
            <li>Tratar dependentes do benefício conforme cadastro oficial.</li>
          </ul>
        </Card>
        <Form
          layout="vertical"
          onFinish={async (v) => {
            await api.post('/benefits', {
              type: 'MEAL_VOUCHER',
              internalName: v.name || 'Benefício exemplo',
              paymentRuleType: 'COMPANY_100',
              valueType: 'DAILY',
              defaultValue: 35,
              understoodAck: v.ok,
              hasDependents: false,
            });
            message.success('Entendimento registrado (exemplo de benefício criado para o fluxo)');
            qc.invalidateQueries({ queryKey: ['benefits'] });
            await tryComplete();
          }}
        >
          <Form.Item
            name="ok"
            valuePropName="checked"
            rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject(new Error('Marque para continuar'))) }]}
          >
            <Checkbox>
              <strong>Entendi</strong> — benefícios não vinculam colaboradores nesta etapa
            </Checkbox>
          </Form.Item>
          <Form.Item name="name" label="Nome interno opcional (exemplo)">
            <Input placeholder="Ex.: Vale refeição — padrão" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Confirmar entendimento e registrar exemplo
          </Button>
        </Form>
      </Space>
    );
  }
  if (slug === 'resumo') {
    const nBen = benefits?.length ?? 0;
    const nSup = suppliers?.length ?? 0;
    const hasVt = benefits?.some((b) => b.type === 'TRANSPORT_VOUCHER');
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Title level={5}>Checklist</Typography.Title>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>{nBen > 0 ? '✔' : '—'} Tipos de benefícios cadastrados</li>
          <li>{nBen > 0 ? '✔' : '—'} Regras de cálculo definidas</li>
          <li>{nBen > 0 ? '✔' : '—'} Valores configurados</li>
          <li>{nSup > 0 ? '✔' : '—'} Fornecedores vinculados</li>
          <li>{hasVt ? '✔' : '—'} Vale transporte (regras específicas no passo 7)</li>
        </ul>
        <Alert type="info" showIcon message="Status: aguardando validação do consultor Sólides após envio." />
        <Alert
          type="success"
          showIcon
          message="Resultado técnico após aprovação"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Tipos de benefício e regras padronizadas disponíveis para a folha;</li>
              <li>Vínculo benefício × colaborador e valores individuais após importação eSocial (etapas posteriores).</li>
            </ul>
          }
        />
        <Space wrap>
          <Button onClick={() => nav('/wizard/etapa-4/passo-2')}>✏️ Lista de tipos</Button>
          <Button onClick={() => nav('/wizard/etapa-4/passo-3')}>✏️ Cadastrar / editar benefício</Button>
          <Button onClick={() => nav('/wizard/etapa-4/passo-4')}>✏️ Regras de cálculo</Button>
          <Button onClick={() => nav('/wizard/etapa-4/passo-6')}>✏️ Fornecedores e layout</Button>
        </Space>
        <Space wrap>
          <Button
            type="primary"
            onClick={() => api.post('/wizard/stages/4/submit', {}).then(() => message.success('Enviado'))}
          >
            📤 Enviar etapa 4 para validação
          </Button>
          <Button onClick={() => nav('/wizard/etapa-5')}>⏭️ Avançar para etapa 5 (rubricas)</Button>
        </Space>
      </Space>
    );
  }
  return <Typography.Text>Defina tipo, regras (rateio 100%), valores e fornecedores via /benefits e /benefit-suppliers.</Typography.Text>;
}

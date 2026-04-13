import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Col,
  Space,
  Table,
  Typography,
  Upload,
  App,
} from '@/ds';
import { useEffect, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { api, unwrap } from '@/services/api';
import { FieldHelp } from '@/components/wizard/FieldHelp';
import {
  clearEmpresaCadastroDraft,
  loadEmpresaCadastroDraft,
  saveEmpresaCadastroDraft,
} from '@/constants/wizardDraft';
import { QK_WIZARD_EMPRESA_CADASTRO, WIZARD_DOMINIO_REST_PREFIX } from '@/constants/wizardEtapaMeta';
import type { WizardEmpresaEtapa1SummaryPayload, WizardEmpresaS1Company } from '@/types/apiResponses';
import {
  isValidBrPhone,
  isValidCnpj,
  isValidCpf,
  isValidLegalName,
  maskCnpj,
  maskCpf,
  maskPhoneBr,
  onlyDigits,
  suggestEmailFix,
} from '@/utils/brForm';

async function uploadBlob(file: File, category: string) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post(`/uploads?category=${category}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap(res) as { id: string };
}

const MAX_BRANCH_CNPJ_FILES = 10;

const ACCEPT_CNPJ_DOC = 'application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp';
const ACCEPT_LOGO = 'image/png,image/jpeg,.png,.jpg,.jpeg';

type Props = {
  slug: string;
  s1?: { company?: WizardEmpresaS1Company };
  form: ReturnType<typeof Form.useForm>[0];
};

export function WizardEmpresaCadastro({ slug, s1, form }: Props) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const watchedDifferentLogos = Form.useWatch('hasDifferentBranchLogos', form);
  const [exOpen, setExOpen] = useState(false);
  const [matrixUploadId, setMatrixUploadId] = useState<string | null>(null);
  const [matrixIllegible, setMatrixIllegible] = useState(false);
  const [matrixNote, setMatrixNote] = useState('');
  const [branchForm] = Form.useForm();

  const { data: branchUploads } = useQuery({
    queryKey: ['uploads', 'CNPJ_BRANCH'],
    queryFn: async () => unwrap(await api.get('/uploads?category=CNPJ_BRANCH')) as { id: string }[],
    enabled: slug === 'passo-3' && !!s1?.company?.hasBranches,
  });

  useEffect(() => {
    if (!s1?.company) return;
    const draft = loadEmpresaCadastroDraft(slug);
    const server: Record<string, unknown> = {};
    if (slug === 'passo-1') server.clientDisplayName = s1.company.clientDisplayName;
    if (slug === 'passo-2') {
      Object.assign(server, {
        legalName: s1.company.legalName,
        taxId: s1.company.taxId,
        contactEmail: s1.company.contactEmail,
        contactPhone: s1.company.contactPhone,
        responsibleName: s1.company.contactPerson?.name,
        responsibleCpf: s1.company.contactPerson?.cpf,
      });
    }
    if (slug === 'passo-3') server.hasBranches = s1.company.hasBranches;
    if (slug === 'passo-4') server.hasDifferentBranchLogos = s1.company.hasDifferentBranchLogos;
    form.setFieldsValue({ ...server, ...draft });
  }, [slug, s1, form]);

  const mClient = useMutation({
    mutationFn: (v: { clientDisplayName: string }) =>
      api.put(`${WIZARD_DOMINIO_REST_PREFIX.empresaCadastro}/client`, v).then((r) => unwrap(r)),
    onSuccess: () => {
      message.success('Salvo');
      clearEmpresaCadastroDraft(slug);
      qc.invalidateQueries({ queryKey: QK_WIZARD_EMPRESA_CADASTRO });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      message.error(e.response?.data?.message || 'Erro'),
  });

  const mMatrix = useMutation({
    mutationFn: (v: Record<string, string>) =>
      api.put(`${WIZARD_DOMINIO_REST_PREFIX.empresaCadastro}/matrix`, v).then((r) => unwrap(r)),
    onSuccess: () => {
      message.success('Dados da matriz salvos');
      clearEmpresaCadastroDraft(slug);
      qc.invalidateQueries({ queryKey: QK_WIZARD_EMPRESA_CADASTRO });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      message.error(e.response?.data?.message || 'Erro'),
  });

  const mBranchesCfg = useMutation({
    mutationFn: (v: { hasBranches: boolean }) =>
      api.put(`${WIZARD_DOMINIO_REST_PREFIX.empresaCadastro}/branches-config`, v).then((r) => unwrap(r)),
    onSuccess: () => {
      message.success('Salvo');
      clearEmpresaCadastroDraft(slug);
      qc.invalidateQueries({ queryKey: QK_WIZARD_EMPRESA_CADASTRO });
    },
  });

  const mBranding = useMutation({
    mutationFn: (v: { hasDifferentBranchLogos: boolean }) =>
      api.put(`${WIZARD_DOMINIO_REST_PREFIX.empresaCadastro}/branding`, v).then((r) => unwrap(r)),
    onSuccess: () => {
      message.success('Salvo');
      clearEmpresaCadastroDraft(slug);
      qc.invalidateQueries({ queryKey: QK_WIZARD_EMPRESA_CADASTRO });
    },
  });

  const mLogo = useMutation({
    mutationFn: async ({
      file,
      scope,
      branchId,
    }: {
      file: File;
      scope: 'COMPANY' | 'BRANCH';
      branchId?: string;
    }) => {
      const up = await uploadBlob(file, scope === 'COMPANY' ? 'LOGO_COMPANY' : 'LOGO_BRANCH');
      return api
        .post(`${WIZARD_DOMINIO_REST_PREFIX.empresaCadastro}/logo`, { uploadedFileId: up.id, scope, branchId })
        .then((r) => unwrap(r));
    },
    onSuccess: () => {
      message.success('Logotipo vinculado');
      qc.invalidateQueries({ queryKey: QK_WIZARD_EMPRESA_CADASTRO });
    },
  });

  const mBranchAdd = useMutation({
    mutationFn: (v: { name: string; legalName?: string; taxId?: string }) =>
      api.post(`${WIZARD_DOMINIO_REST_PREFIX.empresaCadastro}/branches`, v).then((r) => unwrap(r)),
    onSuccess: () => {
      message.success('Filial cadastrada');
      branchForm.resetFields();
      qc.invalidateQueries({ queryKey: QK_WIZARD_EMPRESA_CADASTRO });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      message.error(e.response?.data?.message || 'Erro ao cadastrar filial'),
  });

  const submitStage = useMutation({
    mutationFn: (n: number) => api.post(`/wizard/etapas/${n}/submit`, {}).then((r) => unwrap(r)),
    onSuccess: () => message.success('Enviado para validação consultiva'),
  });

  const saveDraftOnly = () => {
    const v = form.getFieldsValue() as Record<string, unknown>;
    saveEmpresaCadastroDraft(slug, v);
    message.success('Rascunho guardado neste navegador. Você pode continuar depois.');
  };

  const exampleModal = (
    <Modal title="Exemplo" open={exOpen} onCancel={() => setExOpen(false)} footer={null}>
      {slug === 'passo-1' && (
        <Typography.Paragraph>
          Nome interno: <strong>Sólides Tecnologia Ltda</strong> — como a equipe chama a empresa no dia a dia.
        </Typography.Paragraph>
      )}
      {slug === 'passo-2' && (
        <Typography.Paragraph>
          Razão social exatamente como no cartão CNPJ. Responsável: pessoa de contato do RH ou contador. Telefone com
          DDD; e-mail corporativo válido.
        </Typography.Paragraph>
      )}
      {slug === 'passo-3' && (
        <Typography.Paragraph>
          Se houver filiais com empregados, anexe até {MAX_BRANCH_CNPJ_FILES} cartões CNPJ (um arquivo por envio ou por
          filial cadastrada).
        </Typography.Paragraph>
      )}
      {slug === 'passo-4' && (
        <Typography.Paragraph>Um logotipo para toda a empresa ou um por filial, conforme a resposta acima.</Typography.Paragraph>
      )}
    </Modal>
  );

  if (slug === 'passo-1') {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {exampleModal}
        <Alert
          type="info"
          showIcon
          message="Identificação do cliente"
          description="Esse nome é usado apenas no sistema para reconhecer a empresa."
        />
        <Form form={form} layout="vertical" onFinish={(v) => mClient.mutate(v as { clientDisplayName: string })}>
          <Form.Item
            label={
              <FieldHelp
                title="Nome do cliente / empresa"
                help="Informe o nome pelo qual a empresa é conhecida internamente ou comercialmente."
                example="Sólides Tecnologia Ltda"
              />
            }
            name="clientDisplayName"
            rules={[{ required: true, min: 3, message: 'Mínimo 3 caracteres' }]}
          >
            <Input placeholder="Nome para exibição" />
          </Form.Item>
          <Space wrap>
            <Button type="primary" htmlType="submit" loading={mClient.isPending}>
              Salvar e continuar
            </Button>
            <Button htmlType="button" onClick={saveDraftOnly}>
              Salvar e continuar depois
            </Button>
            <Button type="link" onClick={() => setExOpen(true)}>
              Ver exemplo
            </Button>
          </Space>
        </Form>
      </Space>
    );
  }

  if (slug === 'passo-2') {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {exampleModal}
        <Typography.Link href="https://www.gov.br/receitafederal/pt-br" target="_blank" rel="noreferrer">
          Receita Federal — Comprovante de Inscrição e Situação Cadastral
        </Typography.Link>
        <Form form={form} layout="vertical" onFinish={(v) => mMatrix.mutate(v as Record<string, string>)}>
          <Form.Item
            label={
              <FieldHelp
                title="Razão social — matriz"
                help="Digite exatamente como consta no cartão CNPJ, sem abreviações indevidas."
              />
            }
            name="legalName"
            rules={[
              { required: true, message: 'Obrigatório' },
              {
                validator: (_: unknown, v: string) =>
                  isValidLegalName(String(v || ''))
                    ? Promise.resolve()
                    : Promise.reject(new Error('Use apenas letras, números e pontuação corporativa básica.')),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={
              <FieldHelp
                title="CNPJ da matriz (digitado)"
                help="Opcional no formulário se você anexar só o cartão; quando preenchido, deve bater com o cartão. O consultor confere documento × número na validação."
              />
            }
            name="taxId"
            getValueFromEvent={(e) => maskCnpj(e.target.value)}
            rules={[
              {
                validator: (_: unknown, v: string) => {
                  const d = onlyDigits(String(v || ''));
                  if (!d) return Promise.resolve();
                  if (d.length < 14) {
                    return Promise.reject(new Error('Complete o CNPJ com 14 dígitos ou deixe em branco se for anexar só o cartão.'));
                  }
                  return isValidCnpj(d)
                    ? Promise.resolve()
                    : Promise.reject(new Error('CNPJ inválido (verifique os dígitos).'));
                },
              },
            ]}
          >
            <Input maxLength={18} placeholder="00.000.000/0001-00" />
          </Form.Item>
          {matrixUploadId ? (
            <Form.Item noStyle shouldUpdate>
              {() =>
                form.getFieldValue('taxId') ? (
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="Conferência"
                    description="Confirme se o CNPJ digitado é o mesmo do cartão anexado. O consultor poderá usar leitura assistida do documento na validação."
                  />
                ) : null
              }
            </Form.Item>
          ) : null}
          <Form.Item
            label={
              <FieldHelp
                title="Cartão CNPJ (PDF/imagem)"
                help="Anexe o cartão da matriz. Se estiver ilegível, marque abaixo para o consultor revisar."
              />
            }
          >
            <Upload
              maxCount={1}
              accept={ACCEPT_CNPJ_DOC}
              beforeUpload={async (file) => {
                const up = await uploadBlob(file, 'CNPJ_MATRIX');
                setMatrixUploadId(up.id);
                message.success('Arquivo enviado');
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>Upload (PDF ou imagem)</Button>
            </Upload>
          </Form.Item>
          {matrixUploadId && (
            <Card size="small" title="Qualidade do documento" style={{ maxWidth: 480 }}>
              <Space direction="vertical">
                <Checkbox checked={matrixIllegible} onChange={(e) => setMatrixIllegible(e.target.checked)}>
                  Documento ilegível ou de baixa qualidade
                </Checkbox>
                <Input.TextArea
                  placeholder="Observação para o consultor (opcional)"
                  value={matrixNote}
                  onChange={(e) => setMatrixNote(e.target.value)}
                  rows={2}
                />
                <Button
                  size="small"
                  onClick={async () => {
                    await api.put(`/uploads/${matrixUploadId}`, {
                      illegible: matrixIllegible,
                      userNote: matrixNote || undefined,
                    });
                    message.success('Metadados do arquivo atualizados');
                  }}
                >
                  Salvar observações do arquivo
                </Button>
              </Space>
            </Card>
          )}
          <Form.Item
            label={
              <FieldHelp
                title="Nome do responsável"
                help="Pessoa que presta as informações da folha de pagamento."
              />
            }
            name="responsibleName"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={<FieldHelp title="CPF do responsável" help="Validação de dígitos ao salvar no servidor." />}
            name="responsibleCpf"
            rules={[
              { required: true },
              {
                validator: (_: unknown, v: string) =>
                  isValidCpf(String(v || ''))
                    ? Promise.resolve()
                    : Promise.reject(new Error('CPF inválido (verifique os dígitos).')),
              },
            ]}
            getValueFromEvent={(e) => maskCpf(e.target.value)}
          >
            <Input placeholder="000.000.000-00" maxLength={14} />
          </Form.Item>
          <Form.Item
            label={
              <FieldHelp
                title="Telefone (com DDD)"
                help="Preferencialmente número com WhatsApp para contato na implantação."
              />
            }
            name="contactPhone"
            rules={[
              { required: true, message: 'Informe o telefone com DDD' },
              {
                validator: (_: unknown, v: string) =>
                  isValidBrPhone(String(v || ''))
                    ? Promise.resolve()
                    : Promise.reject(new Error('Use DDD + número (10 ou 11 dígitos).')),
              },
            ]}
            getValueFromEvent={(e) => maskPhoneBr(e.target.value)}
          >
            <Input placeholder="(11) 99999-9999" maxLength={16} />
          </Form.Item>
          <Form.Item
            label={<FieldHelp title="E-mail de contato" help="O servidor sugere correção para erros comuns (ex.: domínio)." />}
            name="contactEmail"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input type="email" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.contactEmail !== c.contactEmail}>
            {() => {
              const e = String(form.getFieldValue('contactEmail') || '');
              const hint = e.includes('@') ? suggestEmailFix(e) : null;
              return hint ? (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Sugestão de e-mail"
                  description={
                    <>
                      Você quis dizer <Typography.Text strong>{hint}</Typography.Text>? Ajuste o campo antes de salvar
                      (o servidor também bloqueia domínios digitados incorretamente).
                    </>
                  }
                />
              ) : null;
            }}
          </Form.Item>
          <Space wrap>
            <Button type="primary" htmlType="submit" loading={mMatrix.isPending}>
              Salvar
            </Button>
            <Button htmlType="button" onClick={saveDraftOnly}>
              Salvar e continuar depois
            </Button>
            <Button type="link" onClick={() => setExOpen(true)}>
              Ver exemplo
            </Button>
          </Space>
        </Form>
      </Space>
    );
  }

  if (slug === 'passo-3') {
    const branchCount = branchUploads?.length ?? 0;
    const taxIds = new Set(
      (s1?.company?.branches || []).map((b) => onlyDigits(b.taxId || '')).filter(Boolean),
    );

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {exampleModal}
        <Form form={form} layout="vertical" onFinish={(v) => mBranchesCfg.mutate(v as { hasBranches: boolean })}>
          <Form.Item
            label={<FieldHelp title="A empresa possui filiais?" help="Se sim, cadastre filiais e anexe CNPJs." />}
            name="hasBranches"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value={true}>Sim</Radio>
              <Radio value={false}>Não</Radio>
            </Radio.Group>
          </Form.Item>
          <Space wrap>
            <Button type="primary" htmlType="submit">
              Salvar
            </Button>
            <Button htmlType="button" onClick={saveDraftOnly}>
              Salvar e continuar depois
            </Button>
            <Button type="link" onClick={() => setExOpen(true)}>
              Ver exemplo
            </Button>
          </Space>
        </Form>
        {s1?.company?.hasBranches && (
          <Card title="Filiais" size="small">
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="Anexar CNPJ das filiais"
              description="Anexe os cartões das filiais com empregados ativos (até 10 arquivos). Evite enviar o mesmo arquivo repetido para filiais diferentes — duplicidades serão sinalizadas na validação consultiva."
            />
            <Typography.Paragraph type="secondary">
              Arquivos CNPJ filial nesta empresa: {branchCount}/{MAX_BRANCH_CNPJ_FILES}
            </Typography.Paragraph>
            <Card type="inner" title="Nova filial" size="small" style={{ marginBottom: 16 }}>
              <Form form={branchForm} layout="vertical" onFinish={(v) => mBranchAdd.mutate(v as never)}>
                <Row gutter={8}>
                  <Col xs={24} md={8}>
                    <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="legalName" label="Razão social (opcional)">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="taxId"
                      label="CNPJ"
                      getValueFromEvent={(e) => maskCnpj(e.target.value)}
                      rules={[
                        {
                          validator: (_, v) => {
                            const d = onlyDigits(v || '');
                            if (!d) return Promise.resolve();
                            if (taxIds.has(d)) {
                              return Promise.reject(new Error('CNPJ já cadastrado em outra filial'));
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <Input maxLength={18} />
                    </Form.Item>
                  </Col>
                </Row>
                <Button type="primary" htmlType="submit" loading={mBranchAdd.isPending}>
                  Cadastrar filial
                </Button>
              </Form>
            </Card>
            <Table
              size="small"
              rowKey="id"
              dataSource={s1.company.branches || []}
              columns={[
                { title: 'Nome', dataIndex: 'name' },
                { title: 'CNPJ', dataIndex: 'taxId' },
                {
                  title: 'Cartão CNPJ',
                  render: () => (
                    <Upload
                      accept={ACCEPT_CNPJ_DOC}
                      beforeUpload={async (file) => {
                        if (branchCount >= MAX_BRANCH_CNPJ_FILES) {
                          message.warning(`Limite de ${MAX_BRANCH_CNPJ_FILES} arquivos de CNPJ de filial.`);
                          return false;
                        }
                        await uploadBlob(file, 'CNPJ_BRANCH');
                        message.success('Enviado');
                        qc.invalidateQueries({ queryKey: ['uploads', 'CNPJ_BRANCH'] });
                        return false;
                      }}
                    >
                      <Button size="small">Anexar PDF/imagem</Button>
                    </Upload>
                  ),
                },
              ]}
            />
          </Card>
        )}
      </Space>
    );
  }

  if (slug === 'passo-4') {
    const diffLogos =
      typeof watchedDifferentLogos === 'boolean'
        ? watchedDifferentLogos
        : s1?.company?.hasDifferentBranchLogos === true;
    const branches = s1?.company?.branches ?? [];
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {exampleModal}
        <Form form={form} layout="vertical" onFinish={(v) => mBranding.mutate(v as { hasDifferentBranchLogos: boolean })}>
          <Form.Item
            label={
              <FieldHelp
                title="Filiais com logotipos diferentes?"
                help="Usado para personalização de holerites e relatórios. Se sim, envie um logotipo por filial cadastrada."
              />
            }
            name="hasDifferentBranchLogos"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value={true}>Sim</Radio>
              <Radio value={false}>Não</Radio>
            </Radio.Group>
          </Form.Item>
          <Space wrap>
            <Button type="primary" htmlType="submit">
              Salvar
            </Button>
            <Button htmlType="button" onClick={saveDraftOnly}>
              Salvar e continuar depois
            </Button>
            <Button type="link" onClick={() => setExOpen(true)}>
              Ver exemplo
            </Button>
          </Space>
        </Form>
        {!diffLogos && (
          <div>
            <Typography.Paragraph type="secondary">
              Um logotipo para toda a empresa (opcional; PNG ou JPG).
            </Typography.Paragraph>
            <Upload
              accept={ACCEPT_LOGO}
              showUploadList={false}
              beforeUpload={async (file) => {
                await mLogo.mutateAsync({ file, scope: 'COMPANY' });
                return false;
              }}
            >
              <Button icon={<UploadOutlined />} loading={mLogo.isPending}>
                Upload logotipo da empresa (PNG/JPG)
              </Button>
            </Upload>
          </div>
        )}
        {diffLogos && (
          <Card size="small" title="Logotipo por filial">
            {branches.length === 0 ? (
              <Alert
                type="warning"
                showIcon
                message="Cadastre filiais no passo 3"
                description="Com logotipos distintos por filial, é necessário ter filiais cadastradas antes de anexar cada marca."
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {branches.map((b) => (
                  <Space key={b.id} align="center" wrap>
                    <Typography.Text style={{ minWidth: 160 }} strong>
                      {b.name}
                    </Typography.Text>
                    <Upload
                      accept={ACCEPT_LOGO}
                      showUploadList={false}
                      beforeUpload={async (file) => {
                        await mLogo.mutateAsync({ file, scope: 'BRANCH', branchId: b.id });
                        return false;
                      }}
                    >
                      <Button size="small" icon={<UploadOutlined />} loading={mLogo.isPending}>
                        Enviar logotipo (PNG/JPG)
                      </Button>
                    </Upload>
                  </Space>
                ))}
              </Space>
            )}
          </Card>
        )}
      </Space>
    );
  }

  if (slug === 'resumo') {
    return <WizardEmpresaCadastroResumo onSubmit={() => submitStage.mutate(1)} loading={submitStage.isPending} />;
  }

  return null;
}

function WizardEmpresaCadastroResumo({ onSubmit, loading }: { onSubmit: () => void; loading: boolean }) {
  const { data } = useQuery({
    queryKey: ['w1sum'],
    queryFn: async () =>
      unwrap<WizardEmpresaEtapa1SummaryPayload>(await api.get(`${WIZARD_DOMINIO_REST_PREFIX.empresaCadastro}/summary`)),
  });
  const labels: Record<string, string> = {
    clientNamed: 'Nome do cliente / empresa informado',
    matrixFilled: 'Dados da matriz preenchidos',
    responsibleOk: 'Responsável identificado',
    branchesDefined: 'Estrutura de filiais definida',
    documentsAttached: 'Documentos anexados',
    brandingOk: 'Identidade visual (logotipo, quando aplicável)',
  };
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Alert
        type="warning"
        showIcon
        message="Status após envio: em validação consultiva"
        description="Um consultor da Sólides revisará matriz, filiais e documentos. Com tudo correto, a etapa será aprovada e a parametrização técnica seguirá; cálculos de folha permanecem bloqueados até a validação final."
      />
      <Typography.Title level={5}>Checklist automático</Typography.Title>
      <ul>
        {data?.checklist &&
          Object.entries(data.checklist as Record<string, boolean>).map(([k, v]) => (
            <li key={k}>
              {labels[k] || k}: {v ? '✔' : '—'}
            </li>
          ))}
      </ul>
      <Alert
        type="info"
        showIcon
        message="Resultado técnico ao concluir a etapa 1"
        description={
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Criação/atualização da entidade empresa (matriz e filiais cadastradas);</li>
            <li>Base cadastral preparada para integração eSocial nas etapas seguintes;</li>
            <li>Cálculos de folha permanecem bloqueados até a validação consultiva final.</li>
          </ul>
        }
      />
      <Button type="primary" onClick={onSubmit} loading={loading}>
        Enviar etapa 1 para validação
      </Button>
    </Space>
  );
}

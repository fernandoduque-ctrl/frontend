import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Input,
  Radio,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
  App,
} from '@/ds';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, unwrap } from '@/services/api';
import type {
  EsocialAlertItem,
  EsocialBatchDetailPayload,
  EsocialBatchPreviewPayload,
} from '@/types/apiResponses';
import { downloadAuthenticatedTextFile } from '@/utils/downloadText';
import { getEsocialBatchId, setEsocialBatchId } from './esocialBatch';

const ES_EVENT_OPTIONS: { value: string; label: string; required?: boolean }[] = [
  { value: 'trabalhadores', label: 'Cadastros de trabalhadores (vínculos)', required: true },
  { value: 'remuneracoes', label: 'Remunerações', required: true },
  { value: 'pagamentos', label: 'Pagamentos' },
  { value: 'afastamentos', label: 'Afastamentos' },
  { value: 'ferias', label: 'Férias' },
  { value: 'desligamentos', label: 'Desligamentos' },
  { value: 'tabelas', label: 'Tabelas vigentes (quando aplicável)' },
];

const REQUIRED_ES_EVENTS = new Set(['trabalhadores', 'remuneracoes']);

function withRequiredEvents(selected: string[]) {
  return [...new Set([...REQUIRED_ES_EVENTS, ...selected])];
}

export function WizardImportacaoEsocial({
  slug,
  access,
  accessLoading,
}: {
  slug: string;
  access: { allowed?: boolean; reasons?: string[] } | undefined;
  accessLoading: boolean;
}) {
  const { message } = App.useApp();
  const nav = useNavigate();
  const [cert, setCert] = useState({ type: 'A1', cnpj: '', env: 'RESTRICTED_PRODUCTION' as const });
  const [period, setPeriod] = useState({ start: dayjs().subtract(12, 'month'), end: dayjs() });
  const [events, setEvents] = useState<string[]>(['trabalhadores', 'remuneracoes']);

  if (accessLoading) {
    return <Typography.Text>Verificando pré-requisitos…</Typography.Text>;
  }

  if (!access?.allowed && slug !== 'passo-1') {
    return (
      <Alert
        type="error"
        message="Etapa 6 bloqueada"
        description={
          <ul>
            {(access?.reasons || ['Carregando…']).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        }
      />
    );
  }

  if (slug === 'passo-1') {
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Title level={5}>Importação histórica do eSocial</Typography.Title>
        <Typography.Paragraph>
          Traga automaticamente os dados oficiais do governo para o sistema. O que pode ser importado (conforme o
          período e eventos escolhidos):
        </Typography.Paragraph>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Vínculos (S-2200 / S-2300)</li>
          <li>Remunerações (S-1200)</li>
          <li>Pagamentos (S-1210)</li>
          <li>Afastamentos (S-2230)</li>
          <li>Férias (S-2230)</li>
          <li>Desligamentos (S-2299 / S-2399)</li>
          <li>Tabelas já vigentes (quando aplicável)</li>
        </ul>
        <Typography.Paragraph type="secondary">
          Neste MVP a coleta é <strong>simulada</strong>. Em produção: staging, pré-visualização completa e confirmação
          explícita antes de gravar — <strong>nenhum dado definitivo sem sua confirmação</strong>.
        </Typography.Paragraph>
        <Alert
          type="info"
          showIcon
          message="Pré-requisitos técnicos (hard block)"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Etapas 1 a 5 concluídas e validadas no fluxo do wizard;</li>
              <li>Empresa com CNPJ ativo e ambiente eSocial definido (produção ou restrita);</li>
              <li>Certificado digital válido (não expirado) e coerente com o CNPJ da empresa em produção;</li>
              <li>Usuário com perfil apto a operar importação (ex.: administrador) — aplicado no backend em produção.</li>
            </ul>
          }
        />
        {access && !access.allowed && (
          <Alert type="warning" message="Pré-requisitos pendentes" description={access.reasons?.join(' · ')} />
        )}
        <Alert
          type="success"
          showIcon
          message="Diferenciais em relação a importadores tradicionais"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Staging + confirmação explícita em vez de gravação direta silenciosa;</li>
              <li>Pré-visualização por abas e alertas explícitos (rubricas, duplicidade, vínculos);</li>
              <li>UX guiada para o cliente autônomo, com rastreabilidade e compliance.</li>
            </ul>
          }
        />
        <Button
          type="primary"
          disabled={access && !access.allowed}
          onClick={() => nav('/wizard/etapa-6/passo-2')}
          style={{ background: '#722ed1', borderColor: '#722ed1' }}
        >
          🟣 Iniciar importação do eSocial
        </Button>
      </Space>
    );
  }
  if (slug === 'passo-2') {
    return (
      <Space direction="vertical" style={{ maxWidth: 520 }} size="middle">
        <Typography.Text>
          Selecione o certificado digital para acesso ao eSocial. Em produção, CNPJ do certificado divergente do da
          empresa ou certificado expirado bloqueiam o fluxo.
        </Typography.Text>
        <Radio.Group value={cert.type} onChange={(e) => setCert({ ...cert, type: e.target.value })}>
          <Radio value="A1">Certificado A1 (upload .pfx)</Radio>
          <Radio value="A3">Certificado A3 (token / cartão — simulado)</Radio>
        </Radio.Group>
        <Input placeholder="CNPJ do certificado" value={cert.cnpj} onChange={(e) => setCert({ ...cert, cnpj: e.target.value })} />
        <Select
          value={cert.env}
          onChange={(v) => setCert({ ...cert, env: v })}
          options={[
            { value: 'PRODUCTION', label: 'Produção' },
            { value: 'RESTRICTED_PRODUCTION', label: 'Produção restrita' },
          ]}
        />
        <Input.Password placeholder="Senha (uso em sessão; não armazenada de forma persistente neste MVP)" />
        <Alert
          type="info"
          showIcon
          message="Segurança"
          description="O certificado deve ser usado apenas durante a operação autorizada; evite reutilizar a mesma senha em outros sistemas."
        />
        <Typography.Text type="secondary">Teste: use tipo A1_EXPIRED_SIM no fluxo real para simular bloqueio por validade.</Typography.Text>
      </Space>
    );
  }
  if (slug === 'passo-3') {
    const today = dayjs().endOf('day');
    const monthsSpan = Math.max(0, period.end.diff(period.start, 'month', true));
    const endAfterToday = period.end.isAfter(today);
    const startAfterEnd = period.start.isAfter(period.end);
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          Defina o período histórico a importar. Recomenda-se data final até a competência atual; data inicial não pode
          ser posterior à final.
        </Typography.Paragraph>
        <Space wrap align="center">
          <Space>
            <Typography.Text>Data inicial</Typography.Text>
            <DatePicker value={period.start} onChange={(d) => d && setPeriod({ ...period, start: d })} />
          </Space>
          <Space>
            <Typography.Text>Data final</Typography.Text>
            <DatePicker value={period.end} onChange={(d) => d && setPeriod({ ...period, end: d })} />
          </Space>
        </Space>
        <Typography.Text type="secondary">
          Amplitude: ~{monthsSpan.toFixed(1)} meses
        </Typography.Text>
        {monthsSpan > 36 && (
          <Alert
            type="warning"
            showIcon
            message="Período extenso"
            description="Quanto maior o intervalo, maior o tempo de processamento. Limite sugerido: até 36 meses; avalie dividir em lotes se necessário."
          />
        )}
        {endAfterToday && (
          <Alert type="warning" showIcon message="Data final" description="A data final está após hoje; em produção costuma limitar à competência corrente." />
        )}
        {startAfterEnd && (
          <Alert type="error" showIcon message="Datas inválidas" description="A data inicial não pode ser posterior à data final." />
        )}
      </Space>
    );
  }
  if (slug === 'passo-4') {
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          Escolha os tipos de dados. Trabalhadores e remunerações permanecem obrigatórios neste fluxo.
        </Typography.Paragraph>
        <Space direction="vertical" style={{ gap: 8 }}>
          {ES_EVENT_OPTIONS.map((o) => (
            <Checkbox
              key={o.value}
              checked={events.includes(o.value)}
              disabled={!!o.required}
              onChange={(e) => {
                if (o.required) return;
                if (e.target.checked) {
                  setEvents(withRequiredEvents([...events, o.value]));
                } else {
                  setEvents(withRequiredEvents(events.filter((x) => x !== o.value)));
                }
              }}
            >
              {o.label}
              {o.required ? <Typography.Text type="secondary"> (obrigatório)</Typography.Text> : null}
            </Checkbox>
          ))}
        </Space>
      </Space>
    );
  }
  if (slug === 'passo-5') {
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card size="small" title="Requisição de importação (pré-processamento)">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Em produção: conexão via <strong>Web Services oficiais do eSocial</strong>, consulta <strong>assíncrona por
            lote</strong> e armazenamento em <strong>staging</strong> — nenhuma gravação definitiva na folha até a
            confirmação explícita. Referência de mercado: conversores como o eSocial Fortes (benchmark); aqui há camada
            extra de pré-visualização, alertas e confirmação antes da escrita definitiva.
          </Typography.Paragraph>
        </Card>
        <Button
          type="primary"
          onClick={async () => {
            const body = {
              certificateType: cert.type,
              certificateTaxId: cert.cnpj || undefined,
              environment: cert.env,
              periodStart: period.start.toISOString(),
              periodEnd: period.end.toISOString(),
              selectedEvents: withRequiredEvents(events),
            };
            const batch = unwrap(await api.post('/esocial-import/batches', body)) as { id: string };
            setEsocialBatchId(batch.id);
            await api.post(`/esocial-import/batches/${batch.id}/process`, {});
            message.success('Lote criado e processado (simulação)');
          }}
        >
          Buscar dados no eSocial
        </Button>
      </Space>
    );
  }
  if (slug === 'passo-6') {
    return <EsocialPreview />;
  }
  if (slug === 'passo-7') {
    return <EsocialConfirm />;
  }
  if (slug === 'passo-8') {
    return <EsocialStatus />;
  }
  return null;
}

function EsocialPreview() {
  const id = getEsocialBatchId();
  const { data: preview } = useQuery({
    queryKey: ['esoc-prev', id],
    queryFn: async () =>
      unwrap<EsocialBatchPreviewPayload>(await api.get(`/esocial-import/batches/${id}/preview`)),
    enabled: !!id,
  });
  const { data: alerts } = useQuery({
    queryKey: ['esoc-alerts', id],
    queryFn: async () => unwrap<EsocialAlertItem[]>(await api.get(`/esocial-import/batches/${id}/alerts`)),
    enabled: !!id,
  });
  if (!id) return <Alert message="Processe o passo 5 antes." type="warning" />;
  const colRec = [
    { title: 'Tipo', dataIndex: 'recordType', width: 140 },
    { title: 'ID ext.', dataIndex: 'externalId', width: 120 },
    { title: 'Payload', dataIndex: 'payloadJson', ellipsis: true },
  ];
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Typography.Title level={5} style={{ marginBottom: 0 }}>
        Revise os dados antes de confirmar a importação
      </Typography.Title>
      <Space wrap>
        <Button
          type="default"
          onClick={() =>
            downloadAuthenticatedTextFile(`/esocial-import/batches/${id}/export-log`, `esocial-${id}.txt`)
          }
        >
          Baixar log de importação (.txt)
        </Button>
        <Typography.Link href={`#/wizard/etapa-6/lote/${id}`}>
          Relatório completo — eventos importados, ignorados e inconsistências
        </Typography.Link>
      </Space>
      <Typography.Text type="secondary">
        Resumo: {preview?.counts?.trabalhadores ?? 0} trabalhadores · {preview?.counts?.remuneracoes ?? 0}{' '}
        remunerações · {preview?.counts?.feriasAfastamentos ?? 0} férias/afastamentos
      </Typography.Text>
      <Alert
        type="info"
        showIcon
        message="Pré-visualização — o que conferir antes de confirmar"
        description={
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Diferenças entre a estrutura atual no sistema e os dados oficiais do eSocial.</li>
            <li>Rubricas ou eventos não mapeados (relação com a etapa 5).</li>
            <li>Possíveis eventos duplicados ou inconsistências de vínculo.</li>
            <li>Aba de alertas: inconsistências, vínculos encerrados e demais avisos do processamento em staging.</li>
          </ul>
        }
      />
      <Tabs
        items={[
          {
            key: 't',
            label: 'Trabalhadores',
            children: (
              <Table
                size="small"
                rowKey="id"
                dataSource={preview?.tabs?.trabalhadores || []}
                columns={colRec}
              />
            ),
          },
          {
            key: 'r',
            label: 'Remunerações',
            children: (
              <Table
                size="small"
                rowKey="id"
                dataSource={preview?.tabs?.remuneracoes || []}
                columns={colRec}
              />
            ),
          },
          {
            key: 'f',
            label: 'Férias e afastamentos',
            children: (
              <Table
                size="small"
                rowKey="id"
                dataSource={preview?.tabs?.feriasAfastamentos || []}
                columns={colRec}
              />
            ),
          },
          {
            key: 'a',
            label: 'Alertas',
            children: (
              <Table
                size="small"
                rowKey="id"
                dataSource={alerts || []}
                columns={[
                  { title: 'Severidade', dataIndex: 'severity', width: 110 },
                  { title: 'Título', dataIndex: 'title' },
                  { title: 'Descrição', dataIndex: 'description' },
                ]}
              />
            ),
          },
        ]}
      />
    </Space>
  );
}

function EsocialConfirm() {
  const { message } = App.useApp();
  const id = getEsocialBatchId();
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  if (!id) return <Alert type="warning" message="Nenhum lote ativo — volte ao passo 5." />;
  return (
    <Space direction="vertical" style={{ maxWidth: 560 }} size="middle">
      <Typography.Title level={5}>Confirmação formal do cliente</Typography.Title>
      <Typography.Paragraph>
        Confirma a importação dos dados para o sistema? Após a confirmação, os dados passam a ser utilizados na folha
        (neste MVP a gravação é simulada).
      </Typography.Paragraph>
      <Alert
        type="info"
        showIcon
        message="Após a confirmação (produção)"
        description={
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Staging → base definitiva;</li>
            <li>Associação de trabalhadores, históricos e eventos;</li>
            <li>Rastreabilidade: origem eSocial, data/hora e usuário responsável (compliance).</li>
          </ul>
        }
      />
      <Checkbox checked={ok} onChange={(e) => setOk(e.target.checked)}>
        Estou ciente e confirmo a importação dos dados para a base Folha Digital.
      </Checkbox>
      <Button
        type="primary"
        disabled={!ok}
        loading={loading}
        onClick={async () => {
          setLoading(true);
          try {
            await api.post(`/esocial-import/batches/${id}/confirm`, { confirmationTextAccepted: true });
            message.success('Importação confirmada');
          } finally {
            setLoading(false);
          }
        }}
      >
        Confirmar importação
      </Button>
    </Space>
  );
}

function EsocialStatus() {
  const id = getEsocialBatchId();
  const { data } = useQuery({
    queryKey: ['esoc-batch', id],
    queryFn: async () => unwrap<EsocialBatchDetailPayload>(await api.get(`/esocial-import/batches/${id}`)),
    enabled: !!id,
  });
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Title level={5}>Status da importação</Typography.Title>
      <Typography.Text strong>Estado atual do lote: {data?.status ?? '—'}</Typography.Text>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Estados esperados: importando · importação concluída · concluída com alertas · erro (com log técnico).
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
        Relatório final (na página do lote ou downloads): log de importação, eventos importados, eventos ignorados,
        inconsistências encontradas.
      </Typography.Paragraph>
      {id && <Typography.Link href={`#/wizard/etapa-6/lote/${id}`}>Abrir relatório completo do lote</Typography.Link>}
      <Alert
        type="success"
        showIcon
        message="Resultado técnico após conclusão"
        description={
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Sistema com histórico oficial conferido e base governamental integrada ao fluxo;</li>
            <li>Cliente pode ajustar vínculos, conferir folha e seguir para a primeira folha de processamento.</li>
          </ul>
        }
      />
      <Card size="small" title="Diferenciais vs concorrentes (visão resumida)">
        <Table
          size="small"
          pagination={false}
          rowKey="key"
          columns={[
            { title: 'Abordagem comum', dataIndex: 'comum' },
            { title: 'Folha Digital Sólides (este fluxo)', dataIndex: 'solides' },
          ]}
          dataSource={[
            { key: '1', comum: 'Importação direta à base', solides: 'Staging + confirmação explícita' },
            { key: '2', comum: 'Pouca transparência no lote', solides: 'Pré-visualização por abas e alertas' },
            { key: '3', comum: 'Risco silencioso', solides: 'Alertas explícitos e log para auditoria' },
            { key: '4', comum: 'Foco só técnico', solides: 'UX guiada para o cliente autônomo' },
          ]}
        />
      </Card>
    </Space>
  );
}

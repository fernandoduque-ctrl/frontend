import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Spin,
  Table,
  Typography,
  type ColumnsType,
} from '@/ds';
import { DownloadOutlined } from '@ant-design/icons';
import { api, unwrap } from '@/services/api';
import { downloadBlobContent } from '@/utils/downloadText';
import { renderMermaidErSvg } from './mermaidErSvg';

const { Title, Paragraph, Text } = Typography;

export type SchemaErMermaidResponse = {
  mermaid: string;
  generatedAt: string;
  modelCount: number;
  schemaPath: string;
};

export type SchemaDocColumnDto = {
  campo: string;
  tipo: string;
  obrigatorio: string;
  lista: string;
  chaves: string;
  padrao: string;
  observacoes: string;
};

export type SchemaDocTableDto = {
  nome: string;
  descricao: string;
  colunas: SchemaDocColumnDto[];
};

export type SchemaTablesDocResponse = {
  tabelas: SchemaDocTableDto[];
  generatedAt: string;
  modelCount: number;
  schemaPath: string;
};

const DOC_COLUMNS: ColumnsType<SchemaDocColumnDto> = [
  { title: 'Campo', dataIndex: 'campo', key: 'campo', width: 160, fixed: 'left' },
  { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 160 },
  { title: 'Obrigatório', dataIndex: 'obrigatorio', key: 'obrigatorio', width: 110 },
  { title: 'Lista', dataIndex: 'lista', key: 'lista', width: 80 },
  { title: 'Chaves', dataIndex: 'chaves', key: 'chaves', width: 120 },
  { title: 'Padrão', dataIndex: 'padrao', key: 'padrao', width: 160, ellipsis: true },
  { title: 'Observações', dataIndex: 'observacoes', key: 'observacoes', ellipsis: true },
];

/**
 * Exportação SVG + documentação tabular do schema (API).
 */
export function DatabaseErDiagramPage() {
  const [svgForExport, setSvgForExport] = useState<string | null>(null);
  const [mermaidError, setMermaidError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Diagrama de banco';
    return () => {
      document.title = prev;
    };
  }, []);

  const q = useQuery({
    queryKey: ['documentation', 'schema-er-mermaid'],
    queryFn: async () => unwrap(await api.get<SchemaErMermaidResponse>('/documentation/schema-er-mermaid')),
  });

  const docQ = useQuery({
    queryKey: ['documentation', 'schema-tables-doc'],
    queryFn: async () => unwrap(await api.get<SchemaTablesDocResponse>('/documentation/schema-tables-doc')),
  });

  useEffect(() => {
    setSvgForExport(null);
    setMermaidError(null);
    const text = q.data?.mermaid;
    if (!text) return;

    let cancelled = false;
    renderMermaidErSvg(text)
      .then((svg) => {
        if (!cancelled) setSvgForExport(svg);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const detail = err instanceof Error ? err.message : String(err);
          setMermaidError(detail);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [q.data?.mermaid, q.data?.generatedAt]);

  const exportSvg = useCallback(() => {
    if (!svgForExport) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadBlobContent(svgForExport, `diagrama-er-banco-${stamp}.svg`, 'image/svg+xml');
  }, [svgForExport]);

  const busyMermaid = Boolean(q.data?.mermaid) && !svgForExport && !mermaidError;

  const docTables = docQ.data?.tabelas ?? [];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={2} style={{ marginTop: 0 }}>
        Diagrama de banco
      </Title>
      <Paragraph type="secondary">
        Gerado a partir do <Text code>schema.prisma</Text> na API. Exporte o SVG para draw.io, navegador ou editor
        vetorial. Contratos HTTP:{' '}
        <a href="/documentation/swagger.html">documentação da API (Swagger)</a>.
      </Paragraph>

      {q.isLoading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '32px 0',
          }}
        >
          <Spin size="large" />
          <Text type="secondary">Carregando definição do diagrama…</Text>
        </div>
      )}

      {q.isError && (
        <Alert
          style={{ marginTop: 16 }}
          type="error"
          showIcon
          message="Não foi possível carregar o diagrama"
          description={(q.error as Error)?.message ?? 'Verifique se a API está no ar.'}
        />
      )}

      {mermaidError && (
        <Alert
          style={{ marginTop: 16 }}
          type="error"
          showIcon
          message="Falha ao gerar SVG"
          description={mermaidError}
        />
      )}

      {q.data && !q.isError && (
        <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: busyMermaid ? 8 : 16 }}>
          <Text code>{q.data.schemaPath}</Text> · {q.data.modelCount} modelos ·{' '}
          {new Date(q.data.generatedAt).toLocaleString('pt-BR')}
        </Paragraph>
      )}

      {busyMermaid && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Spin size="small" />
          <Text type="secondary">Gerando SVG…</Text>
        </div>
      )}

      <Button
        type="primary"
        size="large"
        icon={<DownloadOutlined />}
        onClick={exportSvg}
        disabled={!svgForExport || q.isLoading || q.isFetching || busyMermaid}
        block
      >
        Exportar SVG
      </Button>

      <Title level={3} style={{ marginTop: 48, marginBottom: 8 }}>
        Documentação das tabelas
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Propriedades de cada modelo Prisma (campos escalares, enums e relações), alinhadas ao{' '}
        <Text code>schema.prisma</Text>. PK = chave primária, FK = chave estrangeira, UK = único.
      </Paragraph>

      {docQ.isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 0' }}>
          <Spin />
          <Text type="secondary">Carregando documentação…</Text>
        </div>
      )}

      {docQ.isError && (
        <Alert
          type="error"
          showIcon
          message="Não foi possível carregar a documentação das tabelas"
          description={(docQ.error as Error)?.message ?? 'Tente novamente mais tarde.'}
        />
      )}

      {docQ.data && !docQ.isError && (
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          <Text code>{docQ.data.schemaPath}</Text> · {docQ.data.modelCount} tabelas ·{' '}
          {new Date(docQ.data.generatedAt).toLocaleString('pt-BR')}
        </Paragraph>
      )}

      {docTables.map((t) => (
        <Card
          key={t.nome}
          title={
            <Text strong code style={{ fontSize: 15 }}>
              {t.nome}
            </Text>
          }
          style={{ marginBottom: 24 }}
          styles={{ body: { paddingTop: 12 } }}
        >
          <Paragraph style={{ marginBottom: 16, textAlign: 'justify', lineHeight: 1.65 }}>
            {t.descricao}
          </Paragraph>
          <Table<SchemaDocColumnDto>
            size="small"
            rowKey={(row) => `${t.nome}-${row.campo}`}
            columns={DOC_COLUMNS}
            dataSource={t.colunas}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Sem colunas' }}
          />
        </Card>
      ))}
    </div>
  );
}

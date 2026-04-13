import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Button, Card, Space, Table, Tabs, Typography } from '@/ds';
import { useParams } from 'react-router-dom';
import { api, unwrap } from '@/services/api';
import type {
  EsocialAlertItem,
  EsocialBatchDetailPayload,
  EsocialBatchPreviewPayload,
} from '@/types/apiResponses';
import { downloadAuthenticatedTextFile } from '@/utils/downloadText';
import { ESOC_BATCH_KEY } from '@/constants/storageKeys';

export function EsocialLotePage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { data: batch } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: async () =>
      unwrap<EsocialBatchDetailPayload>(await api.get(`/esocial-import/batches/${batchId}`)),
    enabled: !!batchId,
  });
  const { data: preview } = useQuery({
    queryKey: ['batch-prev', batchId],
    queryFn: async () =>
      unwrap<EsocialBatchPreviewPayload>(await api.get(`/esocial-import/batches/${batchId}/preview`)),
    enabled: !!batchId,
  });
  const { data: alerts } = useQuery({
    queryKey: ['batch-alerts', batchId],
    queryFn: async () =>
      unwrap<EsocialAlertItem[]>(await api.get(`/esocial-import/batches/${batchId}/alerts`)),
    enabled: !!batchId,
  });

  useEffect(() => {
    if (!batchId) return;
    localStorage.setItem(ESOC_BATCH_KEY, batchId);
    sessionStorage.setItem(ESOC_BATCH_KEY, batchId);
  }, [batchId]);

  if (!batchId) return null;

  const colRec = [
    { title: 'Tipo', dataIndex: 'recordType', width: 140 },
    { title: 'ID ext.', dataIndex: 'externalId', width: 120 },
    { title: 'Payload', dataIndex: 'payloadJson', ellipsis: true },
  ];

  return (
    <Card
      title={`Lote eSocial ${batchId?.slice(0, 8)}…`}
      extra={
        <Button
          type="default"
          onClick={() =>
            downloadAuthenticatedTextFile(`/esocial-import/batches/${batchId}/export-log`, `esocial-${batchId}.txt`)
          }
        >
          Baixar log
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          Status: <strong>{batch?.status}</strong>
          {preview?.counts != null && (
            <>
              {' '}
              · Trabalhadores: {preview.counts.trabalhadores} · Remunerações: {preview.counts.remuneracoes} ·
              Férias/afast.: {preview.counts.feriasAfastamentos}
            </>
          )}
        </Typography.Paragraph>
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
                    { title: 'Severidade', dataIndex: 'severity' },
                    { title: 'Título', dataIndex: 'title' },
                    { title: 'Descrição', dataIndex: 'description' },
                  ]}
                />
              ),
            },
          ]}
        />
      </Space>
    </Card>
  );
}

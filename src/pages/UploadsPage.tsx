import { useMutation, useQuery } from '@tanstack/react-query';
import { App, Card, Table, Tag, Button, Upload, Switch, Input, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { api, unwrap } from '@/services/api';

type UploadRow = {
  id: string;
  originalName: string;
  category: string;
  size: number;
  storagePath: string;
  illegible?: boolean;
  userNote?: string | null;
};

export function UploadsPage() {
  const { message } = App.useApp();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data, refetch } = useQuery({
    queryKey: ['uploads'],
    queryFn: async () => unwrap(await api.get('/uploads')) as UploadRow[],
  });

  const mMeta = useMutation({
    mutationFn: ({ id, ...body }: { id: string; illegible?: boolean; userNote?: string }) =>
      api.put(`/uploads/${id}`, body).then((r) => unwrap(r)),
    onSuccess: () => {
      message.success('Metadados atualizados');
      refetch();
    },
    onError: () => message.error('Falha ao salvar'),
  });

  const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

  return (
    <Card
      title="Arquivos enviados"
      extra={
        <Upload
          beforeUpload={async (file) => {
            const fd = new FormData();
            fd.append('file', file);
            await api.post('/uploads?category=OTHER', fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            message.success('Enviado');
            refetch();
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>Novo upload</Button>
        </Upload>
      }
    >
      <Table
        rowKey="id"
        dataSource={data || []}
        columns={[
          { title: 'Arquivo', dataIndex: 'originalName' },
          { title: 'Categoria', dataIndex: 'category', render: (c: string) => <Tag>{c}</Tag> },
          { title: 'Tamanho', dataIndex: 'size' },
          {
            title: 'Ilegível',
            width: 100,
            render: (_: unknown, r: UploadRow) => (
              <Switch
                checked={!!r.illegible}
                onChange={(checked) => mMeta.mutate({ id: r.id, illegible: checked })}
              />
            ),
          },
          {
            title: 'Observação',
            render: (_: unknown, r: UploadRow) => (
              <Space.Compact style={{ width: '100%', maxWidth: 280 }}>
                <Input
                  placeholder="Nota do consultor"
                  value={notes[r.id] !== undefined ? notes[r.id] : (r.userNote ?? '')}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                />
                <Button
                  type="primary"
                  onClick={() =>
                    mMeta.mutate({
                      id: r.id,
                      userNote: notes[r.id] !== undefined ? notes[r.id] : (r.userNote ?? '') || '',
                    })
                  }
                >
                  Salvar
                </Button>
              </Space.Compact>
            ),
          },
          {
            title: 'Link',
            render: (_: unknown, r: UploadRow) => (
              <a href={`${base}/files/${r.storagePath}`} target="_blank" rel="noreferrer">
                Abrir
              </a>
            ),
          },
        ]}
      />
    </Card>
  );
}

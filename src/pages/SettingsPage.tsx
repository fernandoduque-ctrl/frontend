import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { App, Card, Form, Switch, Button, Select, Typography } from 'antd';
import { api, unwrap } from '@/services/api';
import { me } from '@/services/auth.service';
import { ACTIVE_COMPANY_ID_KEY } from '@/constants/storageKeys';

const settingsFormDefaults: Record<string, unknown> = {
  notificationsEmail: false,
  darkSidebar: true,
};

export function SettingsPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [activeCompanyId, setActiveCompanyId] = useState<string | undefined>(() =>
    localStorage.getItem(ACTIVE_COMPANY_ID_KEY) || undefined,
  );
  useEffect(() => {
    const onStorage = () => setActiveCompanyId(localStorage.getItem(ACTIVE_COMPANY_ID_KEY) || undefined);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => unwrap(await api.get('/settings')),
  });

  useEffect(() => {
    if (!data?.data) return;
    form.setFieldsValue({ ...settingsFormDefaults, ...data.data });
  }, [data, form]);
  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => me(),
  });
  const internal = profile?.role === 'ADMIN' || profile?.role === 'CONSULTANT';
  const { data: companies } = useQuery({
    queryKey: ['companies-catalog'],
    queryFn: async () => unwrap(await api.get('/companies/list')) as { id: string; clientDisplayName: string }[],
    enabled: !!internal,
  });
  const save = useMutation({
    mutationFn: (v: Record<string, unknown>) => api.put('/settings', { data: v }).then((r) => unwrap(r)),
    onSuccess: () => {
      message.success('Salvo');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return (
    <Card title="Configurações do sistema">
      {internal && companies && companies.length > 0 && (
        <Card type="inner" title="Empresa ativa (admin / consultor)" style={{ marginBottom: 24 }}>
          <Typography.Paragraph type="secondary">
            Dados do wizard e cadastros usam o header enviado à API. Com várias empresas, selecione qual atender.
          </Typography.Paragraph>
          <Select
            style={{ minWidth: 320 }}
            placeholder="Selecionar empresa"
            value={activeCompanyId}
            options={companies.map((c) => ({ value: c.id, label: c.clientDisplayName }))}
            onChange={(id) => {
              localStorage.setItem(ACTIVE_COMPANY_ID_KEY, id);
              setActiveCompanyId(id);
              message.success('Empresa ativa atualizada.');
              qc.invalidateQueries();
            }}
            allowClear
            onClear={() => {
              localStorage.removeItem(ACTIVE_COMPANY_ID_KEY);
              setActiveCompanyId(undefined);
              message.info('Usando primeira empresa do servidor como padrão.');
              qc.invalidateQueries();
            }}
          />
        </Card>
      )}
      <Form
        form={form}
        layout="vertical"
        initialValues={settingsFormDefaults}
        onFinish={(v) => save.mutate(v as Record<string, unknown>)}
      >
        <Form.Item label="Notificações por e-mail" name="notificationsEmail" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="Tema corporativo escuro (preferência)" name="darkSidebar" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={save.isPending}>
          Salvar
        </Button>
      </Form>
    </Card>
  );
}

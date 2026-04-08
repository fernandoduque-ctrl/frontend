import { useQuery } from '@tanstack/react-query';
import { Form, Typography } from 'antd';
import { api, unwrap } from '@/services/api';
import { Stage1Content } from './stage1';
import { Stage2Operational } from './stage2';
import { Stage3 } from './stage3';
import { Stage4 } from './stage4';
import { Stage5 } from './stage5';
import { Stage6 } from './stage6';

export function StepContent({ stage, slug }: { stage: number; slug: string }) {
  const [form] = Form.useForm();

  const { data: s1 } = useQuery({
    queryKey: ['wizard1'],
    queryFn: async () => unwrap(await api.get('/wizard/stage-1')),
    enabled: stage === 1,
  });

  const { data: access6, isLoading: access6Loading } = useQuery({
    queryKey: ['stage6access'],
    queryFn: async () => unwrap(await api.get('/wizard/stage-6/access')),
    enabled: stage === 6,
  });

  if (stage === 1) {
    return <Stage1Content slug={slug} s1={s1} form={form} />;
  }

  if (stage === 2) return <Stage2Operational slug={slug} />;
  if (stage === 3) return <Stage3 slug={slug} />;
  if (stage === 4) return <Stage4 slug={slug} />;
  if (stage === 5) return <Stage5 slug={slug} />;
  if (stage === 6) {
    return <Stage6 slug={slug} access={access6} accessLoading={access6Loading} />;
  }

  return <Typography.Text type="secondary">Passo em construção: etapa {stage} / {slug}</Typography.Text>;
}

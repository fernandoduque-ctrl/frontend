import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const nav = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="Página não encontrada."
      extra={
        <Button type="primary" onClick={() => nav('/dashboard')}>
          Voltar ao dashboard
        </Button>
      }
    />
  );
}

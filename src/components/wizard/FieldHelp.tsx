import { QuestionCircleOutlined } from '@ant-design/icons';
import { Space, Tooltip, Typography } from 'antd';

type Props = { title: string; help: string; example?: string };

export function FieldHelp({ title, help, example }: Props) {
  return (
    <Space size={6}>
      <span>{title}</span>
      <Tooltip
        title={
          <div>
            <Typography.Paragraph style={{ marginBottom: example ? 8 : 0, color: 'inherit' }}>{help}</Typography.Paragraph>
            {example && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Ex.: {example}
              </Typography.Text>
            )}
          </div>
        }
        placement="topLeft"
      >
        <QuestionCircleOutlined style={{ color: 'var(--ant-color-primary)', cursor: 'help' }} />
      </Tooltip>
    </Space>
  );
}

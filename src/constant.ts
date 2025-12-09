import type { ConnectorMetadata } from '@logto/connector-kit';
import { ConnectorConfigFormItemType } from '@logto/connector-kit';

export const defaultMetadata: ConnectorMetadata = {
  id: 'ubill-sms',
  target: 'ubill-sms',
  platform: null,
  name: {
    en: 'Ubill SMS',
    'zh-CN': 'Ubill 短信',
    'tr-TR': 'Ubill SMS',
    ko: 'Ubill SMS',
  },
  logo: './logo.svg',
  logoDark: null,
  description: {
    en: 'Send SMS via Ubill SMS gateway (Georgian phone numbers only)',
    'zh-CN': '通过 Ubill SMS 网关发送短信（仅限格鲁吉亚电话号码）',
    'tr-TR': 'Ubill SMS ağ geçidi ile SMS gönderin (sadece Gürcistan telefon numaraları)',
    ko: 'Ubill SMS 게이트웨이를 통해 SMS 보내기 (조지아 전화번호만 가능)',
  },
  readme: './README.md',
  formItems: [
    {
      key: 'apiKey',
      label: 'API Key',
      type: ConnectorConfigFormItemType.Text,
      required: true,
      placeholder: '<your-ubill-api-key>',
    },
    {
      key: 'brandId',
      label: 'Brand ID',
      type: ConnectorConfigFormItemType.Text,
      required: true,
      placeholder: '<your-brand-id>',
    },
    {
      key: 'apiUrl',
      label: 'API URL',
      type: ConnectorConfigFormItemType.Text,
      required: false,
      placeholder: 'https://api.ubill.dev/v1/sms/send',
      defaultValue: 'https://api.ubill.dev/v1/sms/send',
      description: 'Ubill API endpoint (default: https://api.ubill.dev/v1/sms/send)',
    },
    {
      key: 'templates',
      label: 'Templates',
      type: ConnectorConfigFormItemType.Json,
      required: false,
      defaultValue: [
        {
          usageType: 'SignIn',
          content: 'Your verification code is {{code}}. The code will remain active for 10 minutes.',
        },
        {
          usageType: 'Register',
          content: 'Your verification code is {{code}}. The code will remain active for 10 minutes.',
        },
        {
          usageType: 'ForgotPassword',
          content: 'Your verification code is {{code}}. The code will remain active for 10 minutes.',
        },
        {
          usageType: 'Generic',
          content: 'Your verification code is {{code}}. The code will remain active for 10 minutes.',
        },
      ],
      description: 'Message templates for different use cases. Use {{code}} for verification code.',
    },
  ],
};
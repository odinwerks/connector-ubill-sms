import nock from 'nock';

import { TemplateType } from '@logto/connector-kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

import createConnector from './index.js';

const apiUrl = 'https://api.ubill.dev/v1/sms/send';
const mockedConfig = {
  apiKey: '<api-key>',
  brandId: '12345',
  apiUrl,
};

const getConfig = vi.fn().mockResolvedValue(mockedConfig);

describe('Ubill SMS connector', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('init without throwing errors', async () => {
    await expect(createConnector({ getConfig })).resolves.not.toThrow();
  });

  it('sends the rendered message body to the Ubill API', async () => {
    const url = new URL(apiUrl);
    const mockedPost = nock(url.origin)
      .post(url.pathname, (body) => {
        expect(body).toMatchObject({
          brandID: 12_345,
          numbers: [995_591_234_567],
          text: 'Your verification code is 123456. The code will remain active for 10 minutes.',
          stopList: false,
        });
        return true;
      })
      .reply(200, { statusID: 0, smsID: 'sms-1', message: 'OK' });

    const connector = await createConnector({ getConfig });
    await connector.sendMessage(
      {
        to: '+995591234567',
        type: TemplateType.Generic,
        payload: { code: '123456' },
      },
      {
        ...mockedConfig,
        templates: [
          { usageType: 'SignIn', content: 'code {{code}}' },
          { usageType: 'Register', content: 'code {{code}}' },
          { usageType: 'ForgotPassword', content: 'code {{code}}' },
          {
            usageType: 'Generic',
            content:
              'Your verification code is {{code}}. The code will remain active for 10 minutes.',
          },
        ],
      }
    );

    expect(mockedPost.isDone()).toBe(true);
  });

  it('renders localized `{{t.key}}` placeholders from `config.translations`', async () => {
    const url = new URL(apiUrl);
    const mockedPost = nock(url.origin)
      .post(url.pathname, (body) => {
        expect(body).toMatchObject({ text: 'გამარჯობა 123456' });
        return true;
      })
      .reply(200, { statusID: 0, smsID: 'sms-2', message: 'OK' });

    const connector = await createConnector({ getConfig });
    await connector.sendMessage(
      {
        to: '+995591234567',
        type: TemplateType.Generic,
        payload: { code: '123456', locale: 'ka' },
      },
      {
        ...mockedConfig,
        translations: { ka: { greeting: 'გამარჯობა' } },
        templates: [
          { usageType: 'Register', content: 'code {{code}}' },
          { usageType: 'SignIn', content: 'code {{code}}' },
          { usageType: 'ForgotPassword', content: 'code {{code}}' },
          { usageType: 'Generic', content: '{{t.greeting}} {{code}}' },
        ],
      }
    );

    expect(mockedPost.isDone()).toBe(true);
  });

  it('falls back to the first available language when the requested locale has no exact match', async () => {
    const url = new URL(apiUrl);
    const mockedPost = nock(url.origin)
      .post(url.pathname, (body) => {
        expect(body).toMatchObject({ text: 'გამარჯობა 123456' });
        return true;
      })
      .reply(200, { statusID: 0, smsID: 'sms-3', message: 'OK' });

    const connector = await createConnector({ getConfig });
    await connector.sendMessage(
      {
        to: '+995591234567',
        type: TemplateType.Generic,
        payload: { code: '123456', locale: 'ka-GE' },
      },
      {
        ...mockedConfig,
        translations: { ka: { greeting: 'გამარჯობა' } },
        templates: [
          { usageType: 'Register', content: 'code {{code}}' },
          { usageType: 'SignIn', content: 'code {{code}}' },
          { usageType: 'ForgotPassword', content: 'code {{code}}' },
          { usageType: 'Generic', content: '{{t.greeting}} {{code}}' },
        ],
      }
    );

    expect(mockedPost.isDone()).toBe(true);
  });
});

import { assert } from '@silverhand/essentials';
import { got, HTTPError } from 'got';

import type {
  GetConnectorConfig,
  SendMessageFunction,
  CreateConnector,
  SmsConnector,
} from '@logto/connector-kit';
import {
  ConnectorError,
  ConnectorErrorCodes,
  validateConfig,
  ConnectorType,
  replaceSendMessageHandlebars,
} from '@logto/connector-kit';

import { defaultMetadata } from './constant.js';
import { getLocalizedPayload } from './localization.js';
import type { UbillSmsResponse } from './types.js';
import { ubillSmsConfigGuard } from './types.js';

const sendMessage =
  (getConfig: GetConnectorConfig): SendMessageFunction =>
  async (data, inputConfig) => {
    const { to, type, payload } = data;
    const config = inputConfig ?? (await getConfig(defaultMetadata.id));
    validateConfig(config, ubillSmsConfigGuard);

    const { apiKey, brandId, apiUrl, templates, translations } = config;

    // Find template for the message type
    const template = templates.find((template) => template.usageType === type);

    assert(
      template,
      new ConnectorError(
        ConnectorErrorCodes.TemplateNotFound,
        `Cannot find template for type: ${type}`
      )
    );

    // Resolve the per-locale translation dictionary (`payload.t`) from `config.translations` so
    // that `{{t.key}}` placeholders in the template resolve to the end-user's language. When no
    // translations are configured, this is a backward-compatible no-op (payload unchanged).
    const localizedPayload = getLocalizedPayload(payload, translations);

    // Replace handlebars in template (e.g., {{code}})
    const message = replaceSendMessageHandlebars(template.content, localizedPayload);

    // Validate Georgian phone number
    // eslint-disable-next-line unicorn/prefer-string-replace-all -- `replaceAll` requires `lib: es2021`; this connector targets ES2020.
    const cleanedPhone = to.replace(/\D/g, ''); // Remove non-digits
    const isGeorgian = /^995\d{9}$/.test(cleanedPhone);

    if (!isGeorgian) {
      throw new ConnectorError(
        ConnectorErrorCodes.InvalidConfig,
        `Only Georgian phone numbers (+995) are supported. Received: ${to}`
      );
    }

    // Prepare Ubill API request
    const body = {
      brandID: Number.parseInt(brandId, 10),
      numbers: [Number.parseInt(cleanedPhone, 10)],
      text: message,
      stopList: false,
    };

    try {
      const response = await got.post<UbillSmsResponse>(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          key: apiKey,
        },
        json: body,
        responseType: 'json',
      });

      const result = response.body;

      // Check if successful (statusID 0 indicates success)
      if (result.statusID === 0) {
        return response;
      }
      throw new ConnectorError(
        ConnectorErrorCodes.General,
        `Ubill API error: ${result.message} (statusID: ${result.statusID})`
      );
    } catch (error: unknown) {
      if (error instanceof HTTPError) {
        const {
          response: { body: rawBody },
        } = error;

        assert(
          typeof rawBody === 'string',
          new ConnectorError(
            ConnectorErrorCodes.InvalidResponse,
            `Invalid response raw body type: ${typeof rawBody}`
          )
        );

        throw new ConnectorError(ConnectorErrorCodes.General, rawBody);
      }

      // Re-throw ConnectorError instances
      if (error instanceof ConnectorError) {
        throw error;
      }

      throw new ConnectorError(
        ConnectorErrorCodes.General,
        error instanceof Error ? error.message : String(error)
      );
    }
  };

const createUbillSmsConnector: CreateConnector<SmsConnector> = async ({ getConfig }) => {
  return {
    metadata: defaultMetadata,
    type: ConnectorType.Sms,
    configGuard: ubillSmsConfigGuard,
    sendMessage: sendMessage(getConfig),
  };
};

export default createUbillSmsConnector;

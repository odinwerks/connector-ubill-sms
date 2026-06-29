import { z } from 'zod';

/**
 * Ubill SMS connector configuration
 *
 * @see https://api.ubill.dev/v1/sms/send
 */
export const ubillSmsConfigGuard = z.object({
  apiKey: z.string(),
  brandId: z.string(),
  apiUrl: z.string().default('https://api.ubill.dev/v1/sms/send'),
  // Optional: custom message templates
  templates: z
    .array(
      z.object({
        usageType: z.string(),
        content: z.string(),
      })
    )
    .default([
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
    ]),
  // Optional: localization dictionaries for `{{t.key}}` template placeholders.
  translations: z.record(z.record(z.string())).optional(),
  // Optional: Unified template editor (dev-flagged, console-only) source fields. Consumed only by
  // the admin console's Unified editor; `sendMessage` never reads them. The console compiles them
  // into the runtime `templates` + `translations` shapes on save, so they are persisted purely so
  // reopening the editor rehydrates the unified source.
  unifiedTemplate: z.record(z.unknown()).optional(),
  variables: z.record(z.unknown()).optional(),
  unifiedTranslations: z.record(z.unknown()).optional(),
  templateEditorMode: z.string().optional(),
});

export type UbillSmsConfig = z.infer<typeof ubillSmsConfigGuard>;

/**
 * Ubill API response
 */
export type UbillSmsResponse = {
  statusID: number;
  smsID?: string;
  message: string;
};

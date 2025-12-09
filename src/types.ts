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
  templates: z.array(
    z.object({
      usageType: z.string(),
      content: z.string(),
    })
  ).default([
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
# Ubill SMS Connector

Send SMS via Ubill SMS gateway. Only supports Georgian phone numbers (+995).

## Configuration

### Required fields

- **API Key**: Your Ubill API key
- **Brand ID**: Your Ubill brand ID

### Optional fields

- **API URL**: Ubill API endpoint (default: `https://api.ubill.dev/v1/sms/send`)
- **Templates**: Message templates for different use cases

### Templates

The connector supports templates for different message types:
- `SignIn`: User sign-in verification
- `Register`: User registration verification  
- `ForgotPassword`: Password reset verification
- `Generic`: Generic verification

Each template should contain `{{code}}` placeholder which will be replaced with the actual verification code.

Example template:
```json
{
  "usageType": "SignIn",
  "content": "Your verification code is {{code}}. The code will remain active for 10 minutes."
}
```

## Phone number validation

Only Georgian phone numbers (starting with +995) are supported. The connector will reject any non-Georgian numbers.

## Ubill API

The connector sends requests to Ubill API with the following format:
```json
{
  "brandID": 3,
  "numbers": [995511147839],
  "text": "Your verification code is 123456.",
  "stopList": false
}
```

Successful responses have `statusID: 0`. Any other statusID is considered an error.

## Error handling

- Invalid Georgian phone numbers: `InvalidConfig` error
- Ubill API errors: `General` error with Ubill's error message
- Network errors: `General` error
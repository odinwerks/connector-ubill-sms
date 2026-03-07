# Ubill SMS Connector - Complete Guide

## Overview

The Ubill SMS connector enables Logto to send verification codes via SMS using the Ubill SMS gateway. This connector is specifically designed for Georgian phone numbers (+995 prefix) and integrates seamlessly with Logto's passwordless authentication system.

### Key Features
- Send SMS verification codes for sign-in, registration, password reset, and generic use cases
- Exclusive support for Georgian phone numbers (+995 country code)
- Customizable message templates with `{{code}}` placeholder
- Robust error handling and validation
- Built on Logto's connector-kit framework

## Prerequisites

### System Requirements
- **Logto Instance**: Version 1.36.0 or compatible
- **Node.js**: 22.14.0+ (for development/build)
- **Package Manager**: pnpm (in-container), npm (host)
- **Container Access**: Docker CLI and access to Logto container

### Ubill Account Requirements
- Active Ubill account with SMS capabilities
- API Key from Ubill dashboard
- Brand ID from Ubill configuration
- Sufficient credits for SMS sending

### Project Structure
```
connector-ubill-sms/
├── src/
│   ├── index.ts          # Main connector implementation (sendMessage)
│   ├── constant.ts       # Connector metadata and form configuration
│   └── types.ts          # Zod schemas and TypeScript types
├── lib/                  # Built JavaScript files (generated)
├── package.json          # Dependencies and build scripts
├── README.md            # User-facing documentation
├── integration.md       # Technical integration guide
├── GUIDE.md            # This comprehensive guide
└── logo.png             # Connector logo
```

## Installation Process

### Step 1: Copy Connector to Logto

Copy the connector folder to Logto's connectors directory inside the container:

```bash
# From host machine, copy to container
docker cp ./connectors/connector-ubill-sms/ 4g63t-logto-1:/etc/logto/packages/connectors/
```

**Note**: Replace `4g63t-logto-1` with your actual Logto container name.

### Step 2: Verify Dependencies

Check that `package.json` uses workspace dependencies:

```json
{
  "dependencies": {
    "@logto/connector-kit": "workspace:^",  // CRITICAL: Must be workspace:^
    "@silverhand/essentials": "^2.9.1",
    "got": "^14.0.0",
    "zod": "3.24.3"
  }
}
```

### Step 3: Create Missing Symlinks

Inside the container, create symlinks for missing packages:

```bash
docker exec 4g63t-logto-1 sh -c '
  cd /etc/logto/packages/connectors/connector-ubill-sms &&
  mkdir -p node_modules/@silverhand &&
  ln -sf ../../../../../node_modules/.pnpm/@silverhand+eslint-config@6.0.1_eslint@8.57.0_prettier@3.5.3_typescript@5.5.3/node_modules/@silverhand/eslint-config node_modules/@silverhand/eslint-config &&
  ln -sf ../../../../../node_modules/.pnpm/@silverhand+ts-config@6.0.0_typescript@5.5.3/node_modules/@silverhand/ts-config node_modules/@silverhand/ts-config
'
```

### Step 4: Build the Connector

Build using Logto's workspace commands:

```bash
docker exec -w /etc/logto 4g63t-logto-1 npx pnpm connectors build
```

**Verify Build**: Check that files are generated in `/etc/logto/packages/connectors/connector-ubill-sms/lib/`:
```bash
docker exec 4g63t-logto-1 ls -la /etc/logto/packages/connectors/connector-ubill-sms/lib/
```

### Step 5: Link the Connector

Link the connector to Logto's core system:

```bash
docker exec -w /etc/logto 4g63t-logto-1 npx pnpm cli connector link
```

**Verify Linking**: Check the symlink was created:
```bash
docker exec 4g63t-logto-1 ls -la /etc/logto/packages/core/connectors/@logto-connector-ubill-sms
```

### Step 6: Restart Logto

Restart the Logto service to load the new connector:

```bash
cd /home/andre/Documents/Votes/Dev/4G63T
docker-compose restart logto
```

## Configuration in Logto Admin Console

Access your Logto Admin Console (typically at `http://localhost:3002`) and navigate to **Connectors**.

### Required Fields

1. **API Key**: Your Ubill API key
   - Obtain from Ubill dashboard
   - Keep confidential - stored encrypted in Logto database

2. **Brand ID**: Your Ubill brand ID
   - Provided by Ubill support
   - Unique identifier for your SMS brand

### Optional Fields

3. **API URL**: Ubill API endpoint
   - Default: `https://api.ubill.dev/v1/sms/send`
   - Only change if Ubill provides a different endpoint

4. **Templates**: Message templates for different use cases
   - JSON array of template objects
   - Each template must contain `{{code}}` placeholder

### Template Configuration

Templates are configured as a JSON array. Example:

```json
[
  {
    "usageType": "SignIn",
    "content": "Your verification code is {{code}}. The code will remain active for 10 minutes."
  },
  {
    "usageType": "Register",
    "content": "Welcome! Your verification code is {{code}}. Valid for 10 minutes."
  },
  {
    "usageType": "ForgotPassword",
    "content": "Password reset code: {{code}}. This code expires in 10 minutes."
  },
  {
    "usageType": "Generic",
    "content": "Your code is {{code}}. Valid for 10 minutes."
  }
]
```

**Supported `usageType` Values**:
- `SignIn`: User sign-in verification
- `Register`: User registration verification  
- `ForgotPassword`: Password reset verification
- `Generic`: Generic verification codes

**Template Rules**:
- Must contain `{{code}}` placeholder
- Content should be concise (SMS character limits apply)
- Can include emojis or special characters if supported by carrier
- Maximum 160 characters recommended

## Phone Number Validation

### Validation Rules
The connector validates phone numbers to ensure:
- Starts with `+995` (Georgian country code)
- Follows E.164 international format
- Contains 9 digits after country code (total 12-13 digits)
- Contains only valid numeric characters

### Valid Examples
- `+995511147839`
- `+995322123456`
- `+995577987654`

### Invalid Examples (Will Be Rejected)
- `+1-555-123-4567` (Non-Georgian)
- `995511147839` (Missing `+`)
- `+995511` (Too short)
- `+995abc123456` (Non-numeric)

## Using the Connector

### Test Configuration
1. In Admin Console, click "Set up" on Ubill SMS connector
2. Fill in API Key and Brand ID
3. (Optional) Configure custom templates
4. Click "Save and done"
5. Use "Send test SMS" to verify configuration

### Integration with Applications
Once configured, the connector automatically handles:
- User sign-in verification codes
- User registration verification codes  
- Password reset verification codes
- Any other SMS verification needs

### Flow Overview
```
User Requests SMS → Logto Generates Code → Ubill Connector → Ubill API → User's Phone
       ↑                                              ↓
       └─────── User Enters Code ←─────────────── SMS Delivered
```

## API Integration Details

### Request Format
The connector sends HTTP POST requests to Ubill API:

```json
{
  "brandID": 3,
  "numbers": [995511147839],
  "text": "Your verification code is 123456.",
  "stopList": false
}
```

**Field Descriptions**:
- `brandID`: Your Brand ID (converted to number)
- `numbers`: Array containing the phone number without `+` prefix
- `text`: The message content with verification code
- `stopList`: Always `false` (prevents number blacklisting)

### Response Handling

**Successful Response**:
```json
{
  "statusID": 0,
  "status": "Success",
  "messageID": "ABC123XYZ"
}
```

**Error Response**:
```json
{
  "statusID": 1,
  "status": "Error",
  "message": "Invalid API key"
}
```

### Error Mapping

| Ubill Error | Logto Error Type | User Action Required |
|-------------|------------------|----------------------|
| `statusID: 1` | `General` | Check API credentials |
| `statusID: 2` | `General` | Verify Brand ID |
| `statusID: 3` | `General` | Check account balance |
| `statusID: 4` | `General` | Contact Ubill support |
| Invalid phone | `InvalidConfig` | Use Georgian number |
| Network error | `General` | Check connectivity |

## Testing

### Unit Tests
Run the connector's test suite:

```bash
docker exec -w /etc/logto/packages/connectors/connector-ubill-sms 4g63t-logto-1 npx vitest src
```

### Integration Testing
1. Configure connector in Admin Console
2. Use "Send Test SMS" feature
3. Enter Georgian test number: `+995511147839`
4. Verify SMS delivery
5. Check Logto logs for any errors

### Direct API Testing
Test Ubill API directly:

```bash
curl -X POST https://api.ubill.dev/v1/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "brandID": "YOUR_BRAND_ID",
    "numbers": [995511147839],
    "text": "Test message from Ubill API",
    "stopList": false
  }'
```

## Troubleshooting

### Connector Not Appearing in Admin Console

**Symptoms**: Ubill SMS not listed in available connectors

**Solutions**:
1. Verify symlink exists:
   ```bash
   docker exec 4g63t-logto-1 ls -la /etc/logto/packages/core/connectors/@logto-connector-ubill-sms
   ```

2. Check build output:
   ```bash
   docker exec 4g63t-logto-1 ls -la /etc/logto/packages/connectors/connector-ubill-sms/lib/
   ```

3. Review Logto logs for loading errors:
   ```bash
   cd /home/andre/Documents/Votes/Dev/4G63T
   docker-compose logs logto --tail 100
   ```

4. Re-run linking command:
   ```bash
   docker exec -w /etc/logto 4g63t-logto-1 npx pnpm cli connector link
   ```

### SMS Not Sending

**Symptoms**: Test SMS fails, no delivery

**Solutions**:
1. Verify API credentials are correct
2. Check phone number format (must start with +995)
3. Examine Logto logs for detailed error:
   ```bash
   docker-compose logs logto --tail 50 | grep -i ubill
   ```

4. Test Ubill API directly with curl (see above)
5. Check Ubill account balance
6. Verify phone number is not on stop list

### Build Errors

**Common Issues**:
1. **Missing symlinks**: Ensure `@silverhand/ts-config` and `@silverhand/eslint-config` symlinks exist
2. **Wrong dependency version**: `@logto/connector-kit` must be `"workspace:^"` not `"^4.7.0"`
3. **Node version mismatch**: Ensure Node.js 22.14.0+ in container

**Fix**:
```bash
# Recreate symlinks
docker exec 4g63t-logto-1 sh -c '
  cd /etc/logto/packages/connectors/connector-ubill-sms &&
  rm -rf node_modules/@silverhand &&
  mkdir -p node_modules/@silverhand &&
  ln -sf ../../../../../node_modules/.pnpm/@silverhand+eslint-config@6.0.1_eslint@8.57.0_prettier@3.5.3_typescript@5.5.3/node_modules/@silverhand/eslint-config node_modules/@silverhand/eslint-config &&
  ln -sf ../../../../../node_modules/.pnpm/@silverhand+ts-config@6.0.0_typescript@5.5.3/node_modules/@silverhand/ts-config node_modules/@silverhand/ts-config
'

# Rebuild
docker exec -w /etc/logto 4g63t-logto-1 npx pnpm connectors build
```

### Performance Issues

**Symptoms**: Slow SMS delivery, timeouts

**Solutions**:
1. Check network connectivity to `api.ubill.dev`
2. Verify DNS resolution
3. Monitor Ubill API status (contact support)
4. Consider increasing timeout in connector code if needed

## Maintenance

### Updating the Connector

**Procedure**:
1. Modify source files in `src/` directory
2. Rebuild connector:
   ```bash
   docker exec -w /etc/logto 4g63t-logto-1 npx pnpm connectors build
   ```
3. Restart Logto:
   ```bash
   docker-compose restart logto
   ```

**Note**: Configuration changes in Admin Console don't require rebuild.

### Version Compatibility

| Component | Version | Notes |
|-----------|---------|-------|
| Logto | 1.36.0+ | Tested with 1.36.0 |
| Node.js | 22.14.0+ | Required for ES modules |
| TypeScript | 5.5.3+ | Matches Logto workspace |
| pnpm | 9.0.0+ | Logto's package manager |

### Monitoring

**Key Metrics to Monitor**:
- SMS delivery success rate
- Average delivery time
- Error rates by type
- Ubill API response times

**Logs to Check**:
- Logto application logs (`docker-compose logs logto`)
- Ubill API responses (in Logto connector logs)
- Network connectivity logs

## Security Considerations

### Data Protection
- **API Keys**: Stored encrypted in Logto database
- **Phone Numbers**: Validated and transmitted securely via HTTPS
- **Messages**: Content transmitted encrypted to Ubill API

### Validation Safeguards
1. Phone number validation prevents international SMS charges
2. Input sanitization prevents injection attacks
3. Rate limiting handled by Logto framework
4. Error messages sanitized to avoid information leakage

### Compliance
- Follows Logto security standards
- Uses HTTPS for all API communications
- No sensitive data logged in plaintext
- GDPR-compliant phone number handling

## Support

### Common Issues and Solutions

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| "Invalid phone number" | Non-Georgian number | Use +995 Georgian number |
| "API error" | Invalid credentials | Check API Key and Brand ID |
| "Network error" | Connectivity issue | Verify network to api.ubill.dev |
| No SMS received | Carrier issue | Test with different Georgian number |
| Slow delivery | Ubill API queue | Contact Ubill support |

### Getting Help

**For Connector Issues**:
1. Check this guide and troubleshooting section
2. Review Logto documentation: https://docs.logto.io/
3. Examine Logto logs for detailed errors

**For Ubill API Issues**:
1. Test API directly with curl (see above)
2. Contact Ubill support: support@ubill.dev
3. Check Ubill account status and balance

**For Logto Integration**:
1. Logto documentation: https://docs.logto.io/
2. Logto community forums
3. GitHub issues for Logto project

### Emergency Contact

If SMS service is critical and down:
1. First, test Ubill API directly
2. Check Logto container health
3. Verify network connectivity
4. Contact system administrator

## Appendix

### File Reference

**Source Files**:
- `src/index.ts`: Main `sendMessage` implementation
- `src/constant.ts`: Connector metadata and form configuration
- `src/types.ts`: Zod schemas for configuration validation

**Configuration Files**:
- `package.json`: Dependencies and build scripts
- `tsup.config.ts`: Build configuration
- `tsconfig.json`: TypeScript configuration

**Documentation**:
- `README.md`: User-facing quick start
- `integration.md`: Technical integration details
- `GUIDE.md`: This comprehensive guide

### Command Reference

**Installation Commands**:
```bash
# Copy connector
docker cp ./connectors/connector-ubill-sms/ CONTAINER_NAME:/etc/logto/packages/connectors/

# Build
docker exec -w /etc/logto CONTAINER_NAME npx pnpm connectors build

# Link
docker exec -w /etc/logto CONTAINER_NAME npx pnpm cli connector link

# Restart
docker-compose restart logto
```

**Verification Commands**:
```bash
# Check symlink
docker exec CONTAINER_NAME ls -la /etc/logto/packages/core/connectors/@logto-connector-ubill-sms

# Check build
docker exec CONTAINER_NAME ls -la /etc/logto/packages/connectors/connector-ubill-sms/lib/

# Check logs
docker-compose logs logto --tail 50 | grep -i ubill
```

### Changelog

**Version 1.0.0** (Current)
- Initial release
- Support for Georgian phone numbers only
- Customizable message templates
- Full Logto integration

**Planned Features**:
- Multi-language support
- Delivery reports
- Advanced error handling
- Performance optimizations

---

*Last Updated: February 2024*  
*Maintained by: Andre <andre@forms.nebakoploba.org>*  
*Logto Version: 1.36.0*  
*Ubill API Version: v1*
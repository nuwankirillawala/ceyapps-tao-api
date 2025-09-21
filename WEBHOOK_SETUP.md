# Webhook Setup Guide

## Overview
This guide explains how to set up and test the Stripe webhook endpoint for the TAO API.

## What Was Fixed

### 1. **Authentication Issue**
- **Problem**: Webhook endpoint was protected by JWT authentication
- **Solution**: Added `@Public()` decorator to bypass authentication for webhook calls
- **Why**: Stripe needs to call webhooks without authentication tokens

### 2. **Body Parsing Issue**
- **Problem**: NestJS was parsing JSON bodies, corrupting Stripe signatures
- **Solution**: Added `express.raw({ type: 'application/json' })` middleware
- **Why**: Stripe needs raw body for signature verification

### 3. **Missing Public Decorator**
- **Problem**: `@Public()` decorator didn't exist
- **Solution**: Created `Public` decorator and updated `JwtAuthGuard`
- **Why**: Needed to mark endpoints as public

## Environment Variables Required

Create a `.env` file in the root directory with:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Stripe Dashboard Configuration

### 1. **Webhook Endpoint**
- **URL**: `https://your-domain.com/subscription-plans/webhook`
- **Local Testing**: `http://localhost:3000/subscription-plans/webhook`

### 2. **Events to Listen For**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `payment_intent.succeeded`

### 3. **Webhook Secret**
- Copy the webhook secret from Stripe dashboard
- Add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

## Testing the Webhook

### 1. **Start the Server**
```bash
npm run start:dev
```

### 2. **Test with Stripe CLI** (Recommended)
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Listen for webhooks
stripe listen --forward-to localhost:3000/subscription-plans/webhook

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

### 3. **Test with Test Script**
```bash
node test-webhook.js
```

### 4. **Manual Testing with cURL**
```bash
curl -X POST http://localhost:3000/subscription-plans/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test-signature" \
  -d '{"test": "data"}'
```

## Expected Behavior

### 1. **Successful Webhook Call**
```
[SubscriptionPlansController] Webhook received
[SubscriptionPlansController] Headers: {"stripe-signature":"whsec_...","content-type":"application/json"}
[SubscriptionPlansController] Body length: 1234
[SubscriptionPlansController] Signature: Present
[SubscriptionPlansController] Webhook secret: Present
[SubscriptionPlansController] Webhook event type: checkout.session.completed
[SubscriptionPlansService] Processing webhook event: checkout.session.completed
[SubscriptionPlansService] Event ID: evt_1234567890
[SubscriptionPlansService] Processing checkout.session.completed event
[SubscriptionPlansController] Webhook processed successfully
```

### 2. **Failed Webhook Call**
```
[SubscriptionPlansController] Webhook received
[SubscriptionPlansController] Webhook error: No signatures found matching the expected signature for payload
[SubscriptionPlansController] Error stack: Error: No signatures found...
```

## Troubleshooting

### 1. **"Missing Stripe signature or webhook secret"**
- Check if `STRIPE_WEBHOOK_SECRET` is set in `.env`
- Verify webhook secret in Stripe dashboard
- Ensure webhook endpoint URL is correct

### 2. **"No signatures found matching"**
- Verify `STRIPE_SECRET_KEY` is correct
- Check if webhook endpoint URL matches Stripe dashboard
- Ensure raw body parsing is working

### 3. **"Webhook not receiving events"**
- Check server logs for incoming requests
- Verify Stripe dashboard shows successful webhook deliveries
- Test with Stripe CLI to isolate issues

### 4. **"Authentication required"**
- Ensure `@Public()` decorator is applied to webhook endpoint
- Check if `JwtAuthGuard` is properly updated
- Verify middleware order in `main.ts`

## Security Considerations

### 1. **Webhook Verification**
- Stripe signature verification prevents spoofing
- Never disable signature verification in production
- Use different webhook secrets for test/live modes

### 2. **Environment Variables**
- Keep `.env` file out of version control
- Use strong, unique webhook secrets
- Rotate secrets regularly

### 3. **HTTPS in Production**
- Always use HTTPS for webhook endpoints in production
- Stripe requires HTTPS for live mode webhooks

## Monitoring and Logging

### 1. **Log Levels**
- **INFO**: Successful webhook processing
- **WARN**: Missing data or unhandled events
- **ERROR**: Processing failures or validation errors

### 2. **Key Metrics to Monitor**
- Webhook delivery success rate
- Processing time per event
- Error rates by event type
- Missing or invalid data

### 3. **Alerting**
- Set up alerts for webhook failures
- Monitor for unusual event patterns
- Track webhook delivery delays

## Next Steps

1. **Test with Stripe CLI** to verify webhook functionality
2. **Monitor logs** during payment flows
3. **Set up production webhook endpoint** with HTTPS
4. **Configure monitoring and alerting** for production use
5. **Test with real Stripe events** in test mode

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify Stripe dashboard webhook configuration
3. Test with Stripe CLI to isolate issues
4. Check environment variable configuration
5. Review this guide for common solutions






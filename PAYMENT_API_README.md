# Payment API Documentation

This document describes the comprehensive payment system implemented in the ceyapps-tao-api, following the same structure as the opushub-api payment implementation.

## 🏗️ Architecture Overview

The payment system is organized into four main modules:

1. **Payment User** (`/payment-users`) - Manages Stripe customer information
2. **Cards** (`/cards`) - Handles payment methods and cards
3. **Subscription** (`/subscriptions`) - Manages user subscriptions
4. **Subscription Plans** (`/subscription-plans`) - Administers subscription plans and coupons

## 🔐 Authentication & Authorization

All endpoints require JWT authentication (`JwtAuthGuard`). Admin-only endpoints are protected with `RolesGuard` and require the `ADMIN` role.

## 📋 API Endpoints

### 1. Payment Users (`/payment-users`)

#### Create Payment User
```http
POST /payment-users
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "address": {
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  }
}
```

#### Update Payment User
```http
PUT /payment-users/:customerId
Authorization: Bearer <jwt_token>
```

#### Get Payment User Details
```http
GET /payment-users/:customerId
Authorization: Bearer <jwt_token>
```

#### Get Customer Payment Methods
```http
GET /payment-users/:customerId/payment-methods
Authorization: Bearer <jwt_token>
```

#### Set Default Payment Method
```http
POST /payment-users/:customerId/default-payment-method
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "paymentMethodId": "pm_1234567890"
}
```

#### List All Payment Users (Admin Only)
```http
GET /payment-users
Authorization: Bearer <jwt_token>
Roles: ADMIN
```

#### Delete Payment User (Admin Only)
```http
DELETE /payment-users/:customerId
Authorization: Bearer <jwt_token>
Roles: ADMIN
```

### 2. Cards (`/cards`)

#### Create Payment Method
```http
POST /cards/create-payment-method
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "type": "card",
  "card": {
    "number": "4242424242424242",
    "expMonth": 12,
    "expYear": 2025,
    "cvc": "123"
  }
}
```

#### Attach Card to Customer
```http
POST /cards/attach-card
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "customerId": "cus_1234567890",
  "paymentMethodId": "pm_1234567890",
  "billingDetails": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Get Payment Method Details
```http
GET /cards/payment-method/:id
Authorization: Bearer <jwt_token>
```

#### Update Payment Method
```http
PUT /cards/payment-method/:id
Authorization: Bearer <jwt_token>
```

#### Detach Payment Method
```http
DELETE /cards/payment-method/:id
Authorization: Bearer <jwt_token>
```

#### List Customer Payment Methods
```http
GET /cards/customer/:customerId/payment-methods
Authorization: Bearer <jwt_token>
```

#### Set Default Payment Method
```http
POST /cards/customer/:customerId/default-payment-method
Authorization: Bearer <jwt_token>
```

#### Create Setup Intent
```http
POST /cards/setup-intent
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "customerId": "cus_1234567890",
  "paymentMethodTypes": ["card"]
}
```

#### Confirm Setup Intent
```http
POST /cards/setup-intent/:id/confirm
Authorization: Bearer <jwt_token>
```

#### Create Payment Intent
```http
POST /cards/payment-intent
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "amount": 99.99,
  "currency": "USD",
  "customerId": "cus_1234567890",
  "paymentMethodId": "pm_1234567890",
  "metadata": {
    "orderId": "order_123"
  }
}
```

### 3. Subscriptions (`/subscriptions`)

#### Create Subscription
```http
POST /subscriptions
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "planId": "plan-uuid",
  "paymentMethodId": "pm_1234567890",
  "couponCode": "SAVE20",
  "startTrial": true
}
```

#### Create Subscription Checkout Session
```http
POST /subscriptions/checkout-session
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "planId": "plan-uuid",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel",
  "couponCode": "SAVE20"
}
```

#### Get User Subscriptions
```http
GET /subscriptions
Authorization: Bearer <jwt_token>
```

#### Get Subscription Details
```http
GET /subscriptions/:id
Authorization: Bearer <jwt_token>
```

#### Update Subscription
```http
PUT /subscriptions/:id
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "paymentMethodId": "pm_new_payment_method",
  "cancelAtPeriodEnd": false,
  "planId": "new-plan-uuid"
}
```

#### Cancel Subscription
```http
POST /subscriptions/:id/cancel
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "cancelAtPeriodEnd": true
}
```

#### Reactivate Subscription
```http
POST /subscriptions/:id/reactivate
Authorization: Bearer <jwt_token>
```

### 4. Subscription Plans (`/subscription-plans`)

#### Create Subscription Plan (Admin Only)
```http
POST /subscription-plans
Authorization: Bearer <jwt_token>
Roles: ADMIN
```

**Request Body:**
```json
{
  "name": "Premium Plan",
  "description": "Access to all premium courses",
  "price": 29.99,
  "currency": "USD",
  "interval": "month",
  "intervalCount": 1,
  "features": ["Unlimited courses", "Priority support", "Advanced analytics"],
  "maxCourses": 100,
  "trialDays": 7
}
```

#### Update Subscription Plan (Admin Only)
```http
PUT /subscription-plans/:productId/:priceId
Authorization: Bearer <jwt_token>
Roles: ADMIN
```

#### Archive Subscription Plan (Admin Only)
```http
DELETE /subscription-plans/:productId/:priceId
Authorization: Bearer <jwt_token>
Roles: ADMIN
```

#### List All Subscription Plans
```http
GET /subscription-plans
Authorization: Bearer <jwt_token>
```

#### Search Subscription Plans
```http
GET /subscription-plans/search?q=premium
Authorization: Bearer <jwt_token>
```

#### Get Subscription Plan Details
```http
GET /subscription-plans/:productId
Authorization: Bearer <jwt_token>
```

#### List Plan Prices
```http
GET /subscription-plans/:productId/prices
Authorization: Bearer <jwt_token>
```

#### Get Plan with Pricing
```http
GET /subscription-plans/:productId/with-pricing
Authorization: Bearer <jwt_token>
```

### 5. Coupon Management

#### Create Coupon (Admin Only)
```http
POST /subscription-plans/coupons
Authorization: Bearer <jwt_token>
Roles: ADMIN
```

**Request Body:**
```json
{
  "name": "SUMMER20",
  "percentOff": 20,
  "duration": "repeating",
  "durationInMonths": 3
}
```

#### List All Coupons
```http
GET /subscription-plans/coupons
Authorization: Bearer <jwt_token>
```

#### Get Coupon Details
```http
GET /subscription-plans/coupons/:id
Authorization: Bearer <jwt_token>
```

#### Delete Coupon (Admin Only)
```http
DELETE /subscription-plans/coupons/:id
Authorization: Bearer <jwt_token>
Roles: ADMIN
```

## 🔧 Environment Variables

Make sure to configure the following environment variables:

```env
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Your Stripe webhook secret
```

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   - Set up your Stripe API keys
   - Configure database connection

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Run Database Migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the Application:**
   ```bash
   npm run start:dev
   ```

## 📚 Stripe Integration

The payment system integrates with Stripe for:

- **Customer Management**: Creating and managing Stripe customers
- **Payment Methods**: Handling cards and other payment methods
- **Subscriptions**: Managing recurring billing
- **Plans & Pricing**: Creating and managing subscription tiers
- **Coupons**: Implementing discount codes
- **Webhooks**: Processing Stripe events asynchronously

## 🔒 Security Features

- **JWT Authentication**: All endpoints require valid JWT tokens
- **Role-Based Access Control**: Admin endpoints are protected
- **Input Validation**: Comprehensive request validation using class-validator
- **Error Handling**: Secure error responses without exposing sensitive information

## 🧪 Testing

Use Stripe's test mode for development:

- **Test Card Numbers**: 4242 4242 4242 4242 (Visa)
- **Test CVC**: Any 3 digits
- **Test Expiry**: Any future date

## 📖 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)

## 🤝 Support

For questions or issues with the payment system, please refer to the project documentation or contact the development team.


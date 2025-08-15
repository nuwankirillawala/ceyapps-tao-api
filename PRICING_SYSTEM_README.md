# Course Pricing System

## Overview

The Course Pricing System is a comprehensive solution for managing dynamic pricing across different countries, regions, and user segments. It provides flexible pricing strategies, regional pricing support, discount management, and comprehensive pricing analytics.

## Features

### 🌍 **Regional Pricing**
- **Country-based pricing**: Set different prices for different countries
- **Regional grouping**: Group countries into regions for broader pricing strategies
- **Currency support**: Multi-currency pricing (USD, EUR, GBP, etc.)
- **Geographic targeting**: Target specific markets with custom pricing

### 💰 **Pricing Tiers**
- **BASIC**: Standard pricing for general users
- **PREMIUM**: Higher pricing for premium features
- **ENTERPRISE**: Corporate pricing for business users
- **STUDENT**: Discounted pricing for students
- **INSTRUCTOR**: Special pricing for course creators

### 🎯 **Discount Management**
- **Percentage discounts**: Set discounts from 0-100%
- **Original price tracking**: Maintain history of price changes
- **Time-based discounts**: Set validity periods for promotional pricing
- **Bulk discount application**: Apply discounts to multiple courses at once

### 📊 **Pricing Analytics**
- **Price trend analysis**: Track price changes over time
- **Regional comparison**: Compare pricing across different markets
- **Currency distribution**: Analyze pricing by currency
- **Revenue optimization**: Identify pricing opportunities

### 🔄 **Price History**
- **Change tracking**: Record all price modifications
- **Audit trail**: Track who made changes and when
- **Change reasons**: Categorize price changes (discount, update, etc.)
- **Historical analysis**: Analyze pricing trends over time

## Database Schema

### Core Tables

#### `Pricing`
```sql
- id: Unique identifier
- price: Current price amount
- currency: Currency code (USD, EUR, GBP, etc.)
- country: Country code (US, UK, DE, etc.)
- region: Regional grouping (North America, Europe, etc.)
- isActive: Whether pricing is currently active
- validFrom: When pricing becomes effective
- validTo: When pricing expires (optional)
- discount: Percentage discount (0-100)
- originalPrice: Price before discount
- pricingTier: Pricing tier (BASIC, PREMIUM, etc.)
- createdAt: Creation timestamp
- updatedAt: Last update timestamp
```

#### `CoursePricing`
```sql
- id: Unique identifier
- courseId: Reference to course
- pricingId: Reference to pricing record
- isActive: Whether this course pricing is active
- createdAt: Creation timestamp
- updatedAt: Last update timestamp
```

#### `PricingHistory`
```sql
- id: Unique identifier
- courseId: Reference to course
- oldPrice: Previous price
- newPrice: New price
- currency: Currency used
- country: Country affected
- region: Region affected
- changeReason: Reason for price change
- changedBy: User who made the change
- changedAt: When change was made
```

## API Endpoints

### Pricing Management

#### Create Pricing
```http
POST /pricing
Authorization: Bearer <token>
Role: ADMIN

{
  "price": 99.99,
  "currency": "USD",
  "country": "US",
  "region": "North America",
  "pricingTier": "BASIC",
  "discount": 20,
  "validFrom": "2024-01-01T00:00:00Z",
  "validTo": "2024-12-31T23:59:59Z"
}
```

#### Get All Pricing
```http
GET /pricing?country=US&currency=USD&pricingTier=BASIC&isActive=true
Authorization: Bearer <token>
```

#### Update Pricing
```http
PUT /pricing/:id
Authorization: Bearer <token>
Role: ADMIN

{
  "price": 89.99,
  "discount": 25
}
```

#### Delete Pricing
```http
DELETE /pricing/:id
Authorization: Bearer <token>
Role: ADMIN
```

### Course Pricing Management

#### Assign Pricing to Course
```http
POST /pricing/course
Authorization: Bearer <token>
Role: ADMIN

{
  "courseId": "course-uuid-123",
  "pricingId": "pricing-uuid-456",
  "isActive": true
}
```

#### Get Course Pricing
```http
GET /pricing/course/:courseId?country=US&region=North America
Authorization: Bearer <token>
```

#### Update Course Pricing
```http
PUT /pricing/course/:id
Authorization: Bearer <token>
Role: ADMIN

{
  "isActive": false
}
```

#### Remove Course Pricing
```http
DELETE /pricing/course/:id
Authorization: Bearer <token>
Role: ADMIN
```

### Bulk Operations

#### Bulk Pricing Update
```http
POST /pricing/bulk-update
Authorization: Bearer <token>
Role: ADMIN

{
  "courseIds": ["course-1", "course-2", "course-3"],
  "pricing": {
    "price": 79.99,
    "currency": "USD",
    "country": "US",
    "region": "North America",
    "discount": 30
  },
  "changeReason": "SEASONAL_DISCOUNT"
}
```

### Analytics & History

#### Pricing History
```http
GET /pricing/history/:courseId?country=US&region=North America&limit=50
Authorization: Bearer <token>
```

#### Pricing Analytics
```http
GET /pricing/analytics/summary?country=US&region=North America&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
Role: ADMIN
```

#### Validate Pricing
```http
POST /pricing/validate
Authorization: Bearer <token>

{
  "price": 99.99,
  "currency": "USD",
  "country": "US",
  "region": "North America"
}
```

## Usage Examples

### Setting Up Regional Pricing

1. **Create US Pricing**
```typescript
const usPricing = await settingsService.createPricing({
  price: 99.99,
  currency: 'USD',
  country: 'US',
  region: 'North America',
  pricingTier: 'BASIC'
});
```

2. **Create UK Pricing**
```typescript
const ukPricing = await settingsService.createPricing({
  price: 79.99,
  currency: 'GBP',
  country: 'UK',
  region: 'Europe',
  pricingTier: 'BASIC'
});
```

3. **Assign to Course**
```typescript
await settingsService.createCoursePricing({
  courseId: 'course-uuid-123',
  pricingId: usPricing.id,
  isActive: true
});
```

### Applying Seasonal Discounts

```typescript
// Create promotional pricing
const promotionalPricing = await settingsService.createPricing({
  price: 69.99,
  currency: 'USD',
  country: 'US',
  region: 'North America',
  discount: 30,
  originalPrice: 99.99,
  validFrom: '2024-12-01T00:00:00Z',
  validTo: '2024-12-31T23:59:59Z',
  changeReason: 'SEASONAL'
});

// Apply to multiple courses
await settingsService.bulkUpdatePricing({
  courseIds: ['course-1', 'course-2', 'course-3'],
  pricing: promotionalPricing,
  changeReason: 'SEASONAL_DISCOUNT'
});
```

### Getting Course Pricing for User

```typescript
// Get pricing based on user's location
const coursePricing = await settingsService.getCoursePricing(
  'course-uuid-123',
  'US', // user's country
  'North America' // user's region
);

if (coursePricing.length > 0) {
  const pricing = coursePricing[0].pricing;
  const finalPrice = pricing.discount 
    ? pricing.price * (1 - pricing.discount / 100)
    : pricing.price;
  
  console.log(`Course price: ${pricing.currency} ${finalPrice}`);
}
```

## Configuration

### Environment Variables

```env
# Default currency for new pricing records
DEFAULT_CURRENCY=USD

# Supported currencies (comma-separated)
SUPPORTED_CURRENCIES=USD,EUR,GBP,JPY,INR

# Default pricing tiers
DEFAULT_PRICING_TIER=BASIC

# Price validation rules
MIN_PRICE=0.01
MAX_PRICE=9999.99
MAX_DISCOUNT=100
```

### Pricing Rules

1. **Price Validation**
   - Price must be greater than 0
   - Discount must be between 0-100%
   - Valid dates must be logical (from < to)

2. **Regional Constraints**
   - One pricing record per country/region combination
   - Country codes must be valid ISO codes
   - Currency codes must be valid ISO codes

3. **Business Rules**
   - Cannot delete pricing assigned to courses
   - Price changes are tracked in history
   - Bulk updates are atomic operations

## Testing

### Run Pricing Tests

```bash
# Run all pricing tests
yarn test src/settings/pricing.controller.spec.ts

# Run with coverage
yarn test:cov src/settings/pricing.controller.spec.ts
```

### Test Coverage

The pricing system includes comprehensive tests for:
- ✅ Pricing CRUD operations
- ✅ Course pricing management
- ✅ Bulk pricing updates
- ✅ Pricing history tracking
- ✅ Analytics and validation
- ✅ Error handling and edge cases

## Migration

### Database Migration

```bash
# Generate Prisma client after schema changes
yarn prisma generate

# Run migrations
yarn prisma migrate dev

# Deploy to production
yarn prisma migrate deploy
```

### Data Migration

If migrating from an existing pricing system:

1. **Export existing pricing data**
2. **Transform to new schema format**
3. **Import using the new API endpoints**
4. **Verify data integrity**
5. **Update application code to use new endpoints**

## Performance Considerations

### Indexing Strategy

- **Primary keys**: All tables have UUID primary keys
- **Foreign keys**: Indexed for efficient joins
- **Query optimization**: Composite indexes for common queries
- **History tables**: Partitioned by date for large datasets

### Caching Strategy

- **Pricing cache**: Cache frequently accessed pricing data
- **Regional cache**: Cache pricing by country/region
- **Course cache**: Cache course pricing relationships
- **TTL**: Set appropriate cache expiration times

### Query Optimization

- **Selective includes**: Only fetch required related data
- **Pagination**: Implement pagination for large result sets
- **Filtering**: Use database-level filtering when possible
- **Aggregation**: Use database aggregation for analytics

## Security

### Access Control

- **Authentication**: JWT-based authentication required
- **Authorization**: Role-based access control (ADMIN only for modifications)
- **Audit logging**: All changes are logged with user information
- **Input validation**: Comprehensive DTO validation

### Data Protection

- **Price encryption**: Sensitive pricing data can be encrypted
- **Access logging**: Track all pricing data access
- **Rate limiting**: Prevent abuse of pricing APIs
- **Input sanitization**: Prevent injection attacks

## Monitoring & Alerting

### Key Metrics

- **Price change frequency**: Track how often prices change
- **Regional pricing variance**: Monitor pricing differences across regions
- **Discount usage**: Track discount application patterns
- **API performance**: Monitor response times and error rates

### Alerts

- **Unusual price changes**: Alert on significant price modifications
- **Regional pricing gaps**: Alert when regions lack pricing
- **API errors**: Alert on pricing API failures
- **Performance degradation**: Alert on slow pricing queries

## Future Enhancements

### Planned Features

1. **Dynamic Pricing Engine**
   - AI-powered price optimization
   - Demand-based pricing
   - Competitor price monitoring

2. **Advanced Discounting**
   - Coupon code system
   - Loyalty program integration
   - Bundle pricing strategies

3. **Multi-tenant Support**
   - Organization-level pricing
   - White-label pricing
   - Partner pricing management

4. **Real-time Analytics**
   - Live pricing dashboards
   - Price change notifications
   - Revenue impact analysis

## Support & Documentation

### API Documentation

- **Swagger UI**: Available at `/api-docs`
- **OpenAPI Spec**: Downloadable API specification
- **Code examples**: TypeScript/JavaScript examples
- **Postman collection**: Ready-to-use API collection

### Troubleshooting

Common issues and solutions:

1. **Pricing not found**: Check country/region combination
2. **Validation errors**: Verify DTO requirements
3. **Permission denied**: Ensure user has ADMIN role
4. **Database errors**: Check Prisma client generation

### Getting Help

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check this README and API docs
- **Community**: Join our developer community
- **Support**: Contact support team for urgent issues

---

**Note**: This pricing system is designed to be flexible and scalable. It supports both simple single-country pricing and complex multi-regional pricing strategies. The system automatically handles currency conversions, discount calculations, and price history tracking.

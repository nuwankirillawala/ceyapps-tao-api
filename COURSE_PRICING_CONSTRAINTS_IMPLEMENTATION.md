# Course Pricing Constraints Implementation

## Problem Solved
The course pricing system was allowing multiple prices for the same course in the same country, which caused errors and data inconsistency. This implementation enforces the business rule: **one price per country per course**.

## Changes Made

### 1. Database Schema Updates
- Added index on `country` field in `Pricing` model for better query performance
- Maintained existing unique constraints: `@@unique([country, region])` and `@@unique([courseId, pricingId])`

### 2. Business Logic Updates

#### Settings Service (`src/settings/settings.service.ts`)
- **`createCoursePricing`**: Added validation to check for existing pricing in the same country/region before creating
- **`updateCoursePricing`**: Added validation to prevent conflicts when updating pricing
- **`checkCoursePricingConflict`**: New helper method to check for conflicts
- **`getAvailablePricingLocations`**: New method to get all available pricing locations

#### Key Validation Logic
```typescript
// Check if course already has pricing for the same country and region
const existingCountryPricing = await this.prisma.coursePricing.findFirst({
  where: {
    courseId,
    isActive: true,
    pricing: {
      country: pricing.country,
      region: pricing.region
    }
  }
});

if (existingCountryPricing) {
  throw new BadRequestException(
    `Course already has pricing for country: ${pricing.country}${pricing.region ? `, region: ${pricing.region}` : ''}. ` +
    `Existing price: ${existingCountryPricing.pricing.currency || 'USD'} ${existingCountryPricing.pricing.price}`
  );
}
```

### 3. API Endpoints Added

#### Pricing Controller (`src/settings/pricing.controller.ts`)
- **`GET /pricing/course/:courseId/check-conflict`**: Check for pricing conflicts before creation
- **`GET /pricing/locations/available`**: Get all available pricing locations

### 4. Error Handling
- Clear, descriptive error messages when constraints are violated
- Includes existing pricing details in error messages
- Prevents both creation and update operations that would violate constraints

## Business Rules Enforced

✅ **Allowed:**
- Multiple countries for the same course (different prices)
- Same country for different courses (different prices)
- Different regions within the same country
- Updating pricing within the same country/region

❌ **Not Allowed:**
- Multiple prices for the same course in the same country/region
- Updating course pricing to conflict with existing country/region

## Example Usage

### Check for Conflicts Before Creating
```bash
GET /pricing/course/{courseId}/check-conflict?country=US&region=NorthAmerica
```

### Response Example
```json
{
  "hasConflict": true,
  "existingPricing": {
    "id": "existing-uuid",
    "price": 99.99,
    "currency": "USD",
    "country": "US",
    "region": "North America"
  },
  "message": "Course already has pricing for US, North America: USD 99.99"
}
```

### Get Available Locations
```bash
GET /pricing/locations/available
```

### Response Example
```json
[
  {
    "country": "US",
    "region": null,
    "courseCount": 15
  },
  {
    "country": "UK",
    "region": null,
    "courseCount": 12
  },
  {
    "country": "EU",
    "region": "Western Europe",
    "courseCount": 8
  }
]
```

## Benefits

1. **Data Integrity**: Prevents duplicate pricing for the same course in the same location
2. **Clear Error Messages**: Users understand exactly what conflicts exist
3. **Flexible Pricing**: Supports different prices across countries and courses
4. **Conflict Prevention**: Check for conflicts before attempting to create pricing
5. **Performance**: Added database indexes for better query performance
6. **Maintainability**: Clean, readable code with proper separation of concerns

## Testing

A comprehensive test guide has been created in `test-course-pricing-constraints.md` that covers:
- Basic pricing creation
- Constraint violation scenarios
- Different country/course combinations
- Conflict checking
- Update constraints
- Available locations

## Migration Notes

- **No database migrations required**: Changes are purely in application logic
- **Backward compatible**: Existing pricing data remains unchanged
- **Immediate effect**: New constraints apply as soon as the updated code is deployed

## Future Enhancements

1. **Bulk Conflict Checking**: Check multiple courses/countries at once
2. **Pricing Templates**: Pre-defined pricing structures for common scenarios
3. **Audit Trail**: Track pricing changes and reasons
4. **Automated Conflict Resolution**: Suggest alternatives when conflicts occur

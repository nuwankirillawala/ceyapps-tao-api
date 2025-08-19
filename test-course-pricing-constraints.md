# Course Pricing Constraints Test Guide

## Overview
The course pricing system now enforces the following business rules:
- **One price per country per course**: A course can only have one active pricing for each country/region combination
- **Multiple countries allowed**: Different countries can have different prices for the same course
- **Multiple courses allowed**: Different courses can have different prices in the same country

## Test Scenarios

### 1. Create Basic Pricing Records
First, create some pricing records for different countries:

```bash
# Create US pricing
curl -X POST http://localhost:3000/pricing \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 99.99,
    "country": "US",
    "currency": "USD",
    "isActive": true
  }'

# Create UK pricing
curl -X POST http://localhost:3000/pricing \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 79.99,
    "country": "UK",
    "currency": "GBP",
    "isActive": true
  }'

# Create EU pricing
curl -X POST http://localhost:3000/pricing \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 89.99,
    "country": "EU",
    "currency": "EUR",
    "isActive": true
  }'
```

### 2. Create Course Pricing
Now create course pricing for a course:

```bash
# Get course ID and pricing IDs from previous responses
COURSE_ID="your-course-uuid"
US_PRICING_ID="us-pricing-uuid"
UK_PRICING_ID="uk-pricing-uuid"

# Assign US pricing to course
curl -X POST http://localhost:3000/pricing/course \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "'$COURSE_ID'",
    "pricingId": "'$US_PRICING_ID'"
  }'

# Assign UK pricing to course
curl -X POST http://localhost:3000/pricing/course \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "'$COURSE_ID'",
    "pricingId": "'$UK_PRICING_ID'"
  }'
```

### 3. Test Constraint Violation
Try to create another pricing for the same country:

```bash
# Create another US pricing (different price)
curl -X POST http://localhost:3000/pricing \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 149.99,
    "country": "US",
    "currency": "USD",
    "isActive": true
  }'

# This should succeed and create a new pricing record
NEW_US_PRICING_ID="new-us-pricing-uuid"

# Try to assign this new US pricing to the same course
curl -X POST http://localhost:3000/pricing/course \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "'$COURSE_ID'",
    "pricingId": "'$NEW_US_PRICING_ID'"
  }'

# This should FAIL with error: "Course already has pricing for country: US. Existing price: USD 99.99"
```

### 4. Test Different Countries
Verify that different countries work:

```bash
# This should succeed - different country
curl -X POST http://localhost:3000/pricing/course \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "'$COURSE_ID'",
    "pricingId": "'$EU_PRICING_ID'"
  }'
```

### 5. Test Different Courses
Create pricing for a different course:

```bash
# Create another course
COURSE_2_ID="another-course-uuid"

# This should succeed - same country, different course
curl -X POST http://localhost:3000/pricing/course \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "'$COURSE_2_ID'",
    "pricingId": "'$US_PRICING_ID'"
  }'
```

### 6. Check for Conflicts Before Creating
Use the new conflict check endpoint:

```bash
# Check if there's a conflict before creating
curl -X GET "http://localhost:3000/pricing/course/$COURSE_ID/check-conflict?country=US" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response should show:
# {
#   "hasConflict": true,
#   "existingPricing": {
#     "id": "existing-pricing-uuid",
#     "price": 99.99,
#     "currency": "USD",
#     "country": "US",
#     "region": null
#   },
#   "message": "Course already has pricing for US: USD 99.99"
# }
```

### 7. Test Update Constraints
Try to update existing course pricing to conflict with another:

```bash
# Get the course pricing ID
COURSE_PRICING_ID="course-pricing-uuid"

# Try to update to use the new US pricing (should fail)
curl -X PUT http://localhost:3000/pricing/course/$COURSE_PRICING_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pricingId": "'$NEW_US_PRICING_ID'"
  }'

# This should FAIL with the same constraint error
```

### 8. View Available Locations
Check what pricing locations are available:

```bash
curl -X GET http://localhost:3000/pricing/locations/available \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response should show all countries and regions with pricing
```

## Expected Behavior Summary

✅ **Allowed:**
- Multiple countries for the same course (different prices)
- Same country for different courses (different prices)
- Different regions within the same country
- Updating pricing within the same country/region

❌ **Not Allowed:**
- Multiple prices for the same course in the same country/region
- Updating course pricing to conflict with existing country/region

## Error Messages
When constraints are violated, you'll get clear error messages like:
- "Course already has pricing for country: US, region: North America. Existing price: USD 99.99"
- "Course already has pricing for country: UK. Existing price: GBP 79.99"

## Benefits
1. **Prevents duplicate pricing** for the same course in the same location
2. **Clear error messages** help identify conflicts
3. **Flexible pricing** across different countries and courses
4. **Conflict checking** before creation to avoid errors
5. **Maintains data integrity** in the pricing system

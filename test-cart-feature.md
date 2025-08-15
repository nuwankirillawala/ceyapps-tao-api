# Cart Feature Testing Guide

## Overview
This guide provides step-by-step instructions for testing the newly implemented cart feature in the Tao backend.

## Prerequisites
- ✅ Backend application running
- ✅ Database migrations applied
- ✅ Prisma client generated
- ✅ Valid JWT token for authentication

## Test Data Setup

### 1. Create Test Courses
First, ensure you have some courses in the database to test with:

```sql
-- Example course data (adjust as needed)
INSERT INTO "Course" (id, title, description, "instructorName", level, category) 
VALUES 
  ('course-1', 'Bartending Basics', 'Learn the fundamentals of bartending', 'John Doe', 'BEGINNER', 'BARTENDING'),
  ('course-2', 'Advanced Mixology', 'Master advanced cocktail techniques', 'Jane Smith', 'ADVANCED', 'MIXOLOGY'),
  ('course-3', 'Wine Appreciation', 'Discover the world of wines', 'Mike Johnson', 'INTERMEDIATE', 'WINE');
```

### 2. Create Test Pricing
Add pricing for the test courses:

```sql
-- Example pricing data
INSERT INTO "Pricing" (id, price, country) 
VALUES 
  ('price-1', 49.99, 'US'),
  ('price-2', 79.99, 'US'),
  ('price-3', 59.99, 'US');

INSERT INTO "CoursePricing" (id, "courseId", "pricingId") 
VALUES 
  ('cp-1', 'course-1', 'price-1'),
  ('cp-2', 'course-2', 'price-2'),
  ('cp-3', 'course-3', 'price-3');
```

## API Testing

### 1. Authentication Test
**Endpoint**: Any cart endpoint  
**Expected**: 401 Unauthorized without JWT token

```bash
curl -X GET http://localhost:3000/cart
# Should return: {"statusCode": 401, "message": "Unauthorized"}
```

### 2. Get Empty Cart
**Endpoint**: `GET /cart`  
**Headers**: `Authorization: Bearer <JWT_TOKEN>`  
**Expected**: Empty cart with user ID

```bash
curl -X GET http://localhost:3000/cart \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected Response**:
```json
{
  "id": "cart-uuid",
  "userId": "user-uuid",
  "items": [],
  "totalItems": 0,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 3. Add Course to Cart
**Endpoint**: `POST /cart/add`  
**Headers**: `Authorization: Bearer <JWT_TOKEN>`  
**Body**: Course ID and quantity

```bash
curl -X POST http://localhost:3000/cart/add \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-1",
    "quantity": 1
  }'
```

**Expected Response**: Cart with the added course

### 4. Add Same Course Again (Quantity Update)
**Endpoint**: `POST /cart/add`  
**Body**: Same course ID, different quantity

```bash
curl -X POST http://localhost:3000/cart/add \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-1",
    "quantity": 2
  }'
```

**Expected**: Quantity should increase to 3 (1 + 2), not create duplicate

### 5. Add Another Course
**Endpoint**: `POST /cart/add`  
**Body**: Different course ID

```bash
curl -X POST http://localhost:3000/cart/add \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-2",
    "quantity": 1
  }'
```

**Expected**: Cart should now have 2 courses

### 6. View Cart
**Endpoint**: `GET /cart`  
**Expected**: Cart with 2 courses, total items = 4

### 7. Update Cart Item Quantity
**Endpoint**: `PUT /cart/update`  
**Body**: Update quantity of existing course

```bash
curl -X PUT http://localhost:3000/cart/update \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-1",
    "quantity": 5
  }'
```

**Expected**: Course 1 quantity should be 5

### 8. Get Cart Summary
**Endpoint**: `GET /cart/summary?country=US`  
**Expected**: Summary with pricing calculations

```bash
curl -X GET "http://localhost:3000/cart/summary?country=US" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected Response**:
```json
{
  "totalItems": 6,
  "uniqueCourses": 2,
  "estimatedTotal": 349.93,
  "currency": "USD"
}
```

### 9. Remove Course from Cart
**Endpoint**: `DELETE /cart/remove`  
**Body**: Course ID to remove

```bash
curl -X DELETE http://localhost:3000/cart/remove \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-2"
  }'
```

**Expected**: Course 2 should be removed, cart should have only course 1

### 10. Test Checkout Process
**Endpoint**: `POST /cart/checkout`  
**Body**: Checkout data with items and country

```bash
curl -X POST http://localhost:3000/cart/checkout \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "courseId": "course-1",
        "quantity": 5
      }
    ],
    "country": "US",
    "paymentMethodId": "pm_test_123"
  }'
```

**Expected Response**:
```json
{
  "orderId": "order-uuid",
  "totalAmount": 249.95,
  "currency": "USD",
  "items": 1,
  "message": "Checkout completed successfully"
}
```

### 11. Verify Cart is Updated
**Endpoint**: `GET /cart`  
**Expected**: Cart should be empty or contain only unchecked items

### 12. Clear Cart
**Endpoint**: `DELETE /cart/clear`  
**Expected**: All items removed from cart

```bash
curl -X DELETE http://localhost:3000/cart/clear \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Error Testing

### 1. Invalid Course ID
**Test**: Add course with non-existent UUID  
**Expected**: 404 "Course not found"

### 2. Invalid Quantity
**Test**: Add course with quantity 0 or negative  
**Expected**: 400 validation error

### 3. Update Non-existent Cart Item
**Test**: Update quantity of course not in cart  
**Expected**: 404 "Course not found in cart"

### 4. Checkout Items Not in Cart
**Test**: Checkout with courses not in user's cart  
**Expected**: 400 "Some items are not in your cart"

### 5. Missing Authentication
**Test**: Access cart endpoints without JWT  
**Expected**: 401 "Unauthorized"

## Edge Cases

### 1. Large Quantities
**Test**: Add course with very large quantity (e.g., 999999)  
**Expected**: Should work, but consider adding max limit

### 2. Multiple Rapid Requests
**Test**: Send multiple add/update requests quickly  
**Expected**: Should handle gracefully, maintain data consistency

### 3. Cart with Many Items
**Test**: Add 10+ different courses  
**Expected**: Should handle large carts efficiently

### 4. Concurrent User Carts
**Test**: Multiple users adding to their carts simultaneously  
**Expected**: Each user should have isolated cart

## Performance Testing

### 1. Response Times
- Cart retrieval: Should be < 200ms
- Add to cart: Should be < 300ms
- Checkout: Should be < 1000ms

### 2. Database Queries
- Monitor Prisma query performance
- Check for N+1 query issues
- Verify proper indexing

## Integration Testing

### 1. Order Creation
**Verify**: After checkout, check database for:
- New Order record
- New OrderItem records
- Cart items removed
- Correct pricing calculations

### 2. User Isolation
**Verify**: Users can only access their own carts
- User A cannot see User B's cart
- User A cannot modify User B's cart

### 3. Course Deletion Impact
**Test**: Delete a course that's in a user's cart  
**Expected**: Cart should handle gracefully (consider cascade or validation)

## Swagger UI Testing

### 1. Access Swagger
Navigate to: `http://localhost:3000/api`

### 2. Test Cart Endpoints
- Find the "cart" section
- Click "Try it out" for each endpoint
- Enter test data
- Execute and verify responses

### 3. Authentication
- Click "Authorize" button
- Enter JWT token: `Bearer <your-token>`
- Test authenticated endpoints

## Database Verification

### 1. Check Cart Tables
```sql
-- Verify cart creation
SELECT * FROM "Cart" WHERE "userId" = 'your-user-id';

-- Verify cart items
SELECT * FROM "CartItem" WHERE "cartId" = 'cart-id';

-- Verify no duplicate items
SELECT "cartId", "courseId", COUNT(*) 
FROM "CartItem" 
GROUP BY "cartId", "courseId" 
HAVING COUNT(*) > 1;
```

### 2. Check Order Creation
```sql
-- Verify order creation after checkout
SELECT * FROM "Order" WHERE "userId" = 'your-user-id' ORDER BY "createdAt" DESC;

-- Verify order items
SELECT * FROM "OrderItem" WHERE "orderId" = 'order-id';
```

## Success Criteria

✅ **All endpoints respond correctly**  
✅ **Cart operations work as expected**  
✅ **Quantity management functions properly**  
✅ **Checkout process creates orders**  
✅ **Error handling works correctly**  
✅ **Authentication is enforced**  
✅ **Data integrity maintained**  
✅ **Performance is acceptable**  
✅ **Swagger documentation accurate**  

## Next Steps

After successful testing:
1. **Production Deployment**: Deploy to production environment
2. **Monitoring**: Set up monitoring for cart operations
3. **Analytics**: Track cart abandonment rates
4. **Optimization**: Identify performance bottlenecks
5. **Feature Enhancement**: Consider additional cart features

## Support

If you encounter issues during testing:
1. Check application logs for errors
2. Verify database connectivity
3. Confirm JWT token validity
4. Check Prisma client generation
5. Review migration status

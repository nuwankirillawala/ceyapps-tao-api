# Cart Feature Implementation

## Overview
The cart feature has been successfully implemented to complete the e-commerce flow in the Tao backend. This allows users to add multiple courses to their cart before proceeding to checkout.

## Features Implemented

### 1. Cart Management
- **Add to Cart**: Add courses with quantity
- **Update Cart Items**: Modify quantities or remove items
- **Remove from Cart**: Remove specific courses
- **Clear Cart**: Remove all items at once
- **View Cart**: See all items with course details

### 2. Cart Operations
- **Quantity Management**: Support for multiple quantities per course
- **Duplicate Prevention**: Prevents duplicate courses (updates quantity instead)
- **Auto-cart Creation**: Automatically creates cart for new users
- **Cart Summary**: Get total items and estimated pricing

### 3. Checkout Process
- **Cart to Order**: Convert cart items to orders
- **Pricing Calculation**: Country-based pricing support
- **Order Creation**: Creates Order and OrderItem records
- **Cart Cleanup**: Removes checked-out items from cart

## Database Schema

### New Models Added

#### Cart Model
```prisma
model Cart {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation("UserCart", fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId]) // One cart per user
}
```

#### CartItem Model
```prisma
model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  courseId  String
  course    Course   @relation("CourseCart", fields: [courseId], references: [id], onDelete: Cascade)
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([cartId, courseId]) // Prevent duplicate items in cart
}
```

### Updated Relations
- **User Model**: Added `cart` relation (one-to-one)
- **Course Model**: Added `cartItems` relation (one-to-many)

## API Endpoints

### Cart Controller (`/cart`)

#### GET `/cart`
- **Description**: Get user's cart with all items
- **Authentication**: Required (JWT)
- **Response**: Cart with items and course details

#### POST `/cart/add`
- **Description**: Add course to cart
- **Body**: `AddToCartDto` (courseId, quantity)
- **Authentication**: Required (JWT)
- **Response**: Updated cart

#### PUT `/cart/update`
- **Description**: Update cart item quantity
- **Body**: `UpdateCartItemDto` (courseId, quantity)
- **Authentication**: Required (JWT)
- **Response**: Updated cart

#### DELETE `/cart/remove`
- **Description**: Remove course from cart
- **Body**: `RemoveFromCartDto` (courseId)
- **Authentication**: Required (JWT)
- **Response**: Updated cart

#### DELETE `/cart/clear`
- **Description**: Clear entire cart
- **Authentication**: Required (JWT)
- **Response**: Success message

#### GET `/cart/summary`
- **Description**: Get cart summary with pricing
- **Query**: `country` (optional, defaults to 'US')
- **Authentication**: Required (JWT)
- **Response**: Cart summary with totals

#### POST `/cart/checkout`
- **Description**: Checkout cart items
- **Body**: `CheckoutDto` (items, country, paymentMethodId)
- **Authentication**: Required (JWT)
- **Response**: Order details

## DTOs (Data Transfer Objects)

### AddToCartDto
```typescript
{
  courseId: string;      // UUID of course
  quantity?: number;     // Optional, defaults to 1
}
```

### UpdateCartItemDto
```typescript
{
  courseId: string;      // UUID of course
  quantity: number;      // New quantity (if <= 0, removes item)
}
```

### RemoveFromCartDto
```typescript
{
  courseId: string;      // UUID of course to remove
}
```

### CheckoutDto
```typescript
{
  items: CheckoutItemDto[];  // Array of items to checkout
  country: string;           // Country for pricing
  paymentMethodId?: string;  // Optional payment method
}
```

### CartResponseDto
```typescript
{
  id: string;               // Cart ID
  userId: string;           // User ID
  items: CartItemWithCourseDto[];  // Cart items with course details
  totalItems: number;       // Total quantity of all items
  createdAt: Date;          // Creation timestamp
  updatedAt: Date;          // Last update timestamp
}
```

## Service Methods

### SettingsService Cart Methods

#### `getOrCreateCart(userId: string)`
- Gets existing cart or creates new one
- Returns cart with items and course details
- Calculates total items

#### `addToCart(userId: string, addToCartDto: AddToCartDto)`
- Adds course to cart
- Updates quantity if course already exists
- Returns updated cart

#### `updateCartItem(userId: string, updateCartItemDto: UpdateCartItemDto)`
- Updates cart item quantity
- Removes item if quantity <= 0
- Returns updated cart

#### `removeFromCart(userId: string, removeFromCartDto: RemoveFromCartDto)`
- Removes specific course from cart
- Returns updated cart

#### `clearCart(userId: string)`
- Removes all items from cart
- Returns success message

#### `getCartSummary(userId: string, country: string)`
- Calculates cart totals
- Includes pricing based on country
- Returns summary with estimated total

#### `checkout(userId: string, checkoutDto: CheckoutDto)`
- Validates checkout items
- Creates order and order items
- Removes checked-out items from cart
- Returns order details

## Business Logic

### Cart Creation
- Automatically creates cart when user first adds item
- One cart per user (enforced by unique constraint)
- Cart persists until manually cleared

### Quantity Management
- Prevents duplicate courses by updating quantity
- Supports quantities > 1 (useful for bulk purchases)
- Automatically removes items with quantity <= 0

### Pricing Integration
- Integrates with existing CoursePricing system
- Country-based pricing calculation
- Estimated totals for cart summary

### Checkout Process
- Validates all items exist in user's cart
- Creates Order and OrderItem records
- Removes purchased items from cart
- Supports partial checkout (selected items only)

## Security Features

### Authentication
- All cart endpoints require JWT authentication
- Users can only access their own cart
- JWT guard ensures secure access

### Validation
- Input validation using class-validator
- UUID validation for course IDs
- Quantity validation (minimum 1)
- Country code validation

### Data Integrity
- Foreign key constraints
- Cascade deletes for data consistency
- Unique constraints prevent duplicates

## Error Handling

### Common Error Scenarios
- **Course not found**: 404 when adding non-existent course
- **Cart not found**: 404 when cart doesn't exist
- **Item not in cart**: 404 when updating/removing non-existent item
- **Invalid data**: 400 for validation failures
- **Unauthorized**: 401 for missing/invalid JWT

### Error Responses
- Consistent error message format
- Appropriate HTTP status codes
- Descriptive error messages for debugging

## Integration Points

### Existing Systems
- **User Management**: Integrates with existing user authentication
- **Course System**: Works with existing course models
- **Pricing System**: Uses existing CoursePricing for calculations
- **Order System**: Creates orders using existing Order/OrderItem models

### Future Enhancements
- **Payment Integration**: Ready for Stripe/PayPal integration
- **Inventory Management**: Can be extended for course availability
- **Discount System**: Framework for coupon/discount codes
- **Tax Calculation**: Can be extended for tax calculations

## Testing

### Manual Testing Steps
1. **Add to Cart**: Test adding courses with different quantities
2. **Update Quantities**: Test quantity updates and edge cases
3. **Remove Items**: Test removing specific items
4. **Clear Cart**: Test clearing entire cart
5. **Checkout**: Test complete checkout process
6. **Error Cases**: Test invalid inputs and edge cases

### API Testing
- Use Swagger UI for interactive testing
- Test all endpoints with valid/invalid data
- Verify authentication requirements
- Check response formats and status codes

## Performance Considerations

### Database Queries
- Efficient cart retrieval with includes
- Batch operations for checkout
- Proper indexing on foreign keys

### Caching Opportunities
- Cart contents could be cached
- Pricing calculations could be cached
- User preferences could be cached

## Deployment Notes

### Database Migration
- Migration `20250813221217_add_cart_feature` applied
- Prisma client regenerated
- No breaking changes to existing functionality

### Environment Requirements
- No additional environment variables needed
- Uses existing database connection
- Compatible with current deployment setup

## Summary

The cart feature has been successfully implemented with:
- ✅ Complete cart management (CRUD operations)
- ✅ Quantity management and duplicate prevention
- ✅ Integration with existing pricing system
- ✅ Secure checkout process
- ✅ Comprehensive error handling
- ✅ Full API documentation
- ✅ Database schema updates
- ✅ Service layer implementation
- ✅ Controller endpoints
- ✅ Input validation and security

This completes the e-commerce flow: **Wishlist → Cart → Checkout → Order**, providing users with a seamless shopping experience for courses.

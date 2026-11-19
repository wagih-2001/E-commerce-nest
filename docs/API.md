# E-COMMERCE NESTJS API

## Frontend Integration Documentation — Complete Endpoint Reference

**Repository:** https://github.com/wagih-2001/E-commerce-nest
**Branch reviewed:** `main`
**Stack:** NestJS • TypeScript • MongoDB/Mongoose • JWT • Cloudinary • Multer • Redis
**Base URL:** `{{BASE_URL}}`
**Global prefix:** No `setGlobalPrefix()` was found in the inspected `main.ts`. Use the deployed API origin followed by the routes below.

> This document follows the structure of the supplied Order Module guide, but applies it to every route found in the repository controllers. Request fields and behavior are based on the current controller, DTO, guard, and service source. Response examples are illustrative unless explicitly described as the controller/service return shape.

---

# 1. Base URL, Authentication, and Global Behavior

## Base URL

```text
{{BASE_URL}}
```

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

The repository's `AuthGuard` expects the exact `Bearer <token>` format. It verifies the access token, loads the user from MongoDB, and checks that the token role matches the current database role.

Roles:

- `USER`
- `ADMIN`

Access notation in this guide:

- **Public:** no token required.
- **Authenticated:** valid USER or ADMIN token.
- **ADMIN:** valid token plus `AdminGuard`.
- **Optional Auth:** no token is allowed; if a token is supplied, it must be valid.

## Global Validation

The app configures a global `ValidationPipe` with transformation, whitelisting, and rejection of non-whitelisted fields. DTO constraints described below are enforced by the backend. Unknown request properties may be rejected.

## Global Success Response

The global `TransformInterceptor` wraps normal successful controller results:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {}
}
```

Some controllers already return objects containing `success`, `message`, or `data`; in those cases the global wrapper can produce nested data. Examples below show the controller/service payload where practical. Confirm exact status codes and envelope against the running deployment.

## File Upload Rules

Multer uses memory storage. Accepted image MIME types are jpg, jpeg, png, webp. Maximum file size is **5 MB per file**.

- Single image field: `file`
- Product images field: `images` (up to 5 files)
- Send uploads as `multipart/form-data`.
- For multipart numeric fields, send numeric text values; DTO transforms them to numbers.
- For multipart arrays such as brand `categories`, send a JSON string such as `["CATEGORY_ID_1","CATEGORY_ID_2"]`.

## Endpoint Index

| Module   | Method | Endpoint                        | Access                           |
| -------- | ------ | ------------------------------- | -------------------------------- |
| Auth     | POST   | `/auth/signup`                  | Public                           |
| Auth     | PATCH  | `/auth/verify-email`            | Public                           |
| Auth     | PATCH  | `/auth/resend-otp`              | Public                           |
| Auth     | POST   | `/auth/login`                   | Public                           |
| Auth     | GET    | `/auth/profile`                 | Authenticated                    |
| Auth     | PATCH  | `/auth/profile-pic`             | Authenticated                    |
| Category | POST   | `/category/create-category`     | ADMIN                            |
| Category | GET    | `/category`                     | Optional Auth                    |
| Category | GET    | `/category/:id`                 | Optional Auth                    |
| Category | PATCH  | `/category/update-category/:id` | ADMIN                            |
| Category | DELETE | `/category/delete-category/:id` | ADMIN                            |
| Brand    | POST   | `/brand/create-brand`           | ADMIN                            |
| Brand    | GET    | `/brand`                        | Optional Auth                    |
| Brand    | GET    | `/brand/:id`                    | Optional Auth                    |
| Brand    | PATCH  | `/brand/update-brand/:id`       | ADMIN                            |
| Brand    | DELETE | `/brand/delete-brand/:id`       | ADMIN                            |
| Product  | POST   | `/product/create-product`       | ADMIN                            |
| Product  | GET    | `/product`                      | Optional Auth                    |
| Product  | GET    | `/product/:id`                  | Optional Auth                    |
| Product  | PATCH  | `/product/update-product/:id`   | ADMIN                            |
| Product  | DELETE | `/product/delete-product/:id`   | ADMIN                            |
| Cart     | POST   | `/cart/add-to-cart`             | Authenticated                    |
| Cart     | GET    | `/cart`                         | Authenticated                    |
| Cart     | PATCH  | `/cart/update-cart/:productId`  | Authenticated                    |
| Cart     | DELETE | `/cart/remove-item/:productId`  | Authenticated                    |
| Review   | POST   | `/review/create-review`         | Authenticated                    |
| Review   | GET    | `/review`                       | Public                           |
| Review   | GET    | `/review/:id`                   | Public                           |
| Review   | PATCH  | `/review/update-review/:id`     | Authenticated; owner only        |
| Review   | DELETE | `/review/delete-review/:id`     | Authenticated; owner only        |
| Coupon   | POST   | `/coupon/create-coupon`         | ADMIN                            |
| Coupon   | POST   | `/coupon/validate-coupon`       | Authenticated                    |
| Coupon   | POST   | `/coupon/apply-coupon`          | Authenticated                    |
| Coupon   | DELETE | `/coupon/remove-coupon`         | Authenticated                    |
| Coupon   | GET    | `/coupon`                       | ADMIN                            |
| Coupon   | GET    | `/coupon/:id`                   | ADMIN                            |
| Coupon   | PATCH  | `/coupon/update-coupon/:id`     | ADMIN                            |
| Coupon   | DELETE | `/coupon/delete-coupon/:id`     | ADMIN                            |
| Order    | POST   | `/order/create-order`           | Authenticated                    |
| Order    | POST   | `/order/confirm-order/:id`      | ADMIN                            |
| Order    | PATCH  | `/order/cancel/:id`             | Authenticated; owner/admin rules |
| Order    | GET    | `/order/my-orders`              | Authenticated                    |
| Order    | GET    | `/order`                        | ADMIN                            |
| Order    | GET    | `/order/:id`                    | Authenticated; owner or ADMIN    |
| App      | GET    | `/`                             | Public                           |

---

# 2. Authentication Module

Base path: `{{BASE_URL}}/auth`

## 2.1 Sign Up

**POST** `{{BASE_URL}}/auth/signup`
**Auth:** Public
**Content-Type:** `application/json`

Creates a new user and sends an email verification OTP.

### Request Body

```json
{
  "firstName": "Wagih",
  "lastName": "Ahmed",
  "email": "user@example.com",
  "password": "secret123",
  "gender": "MALE"
}
```

| Field     | Required          | Rules / notes                                                           |
| --------- | ----------------- | ----------------------------------------------------------------------- |
| firstName | Yes               | String, 2–20 characters.                                                |
| lastName  | Yes               | String, 2–20 characters.                                                |
| email     | Yes               | Valid email; trimmed and lowercased.                                    |
| password  | Yes               | String, 6–20 characters.                                                |
| gender    | No                | `MALE` or `FEMALE`.                                                     |
| role      | No in current DTO | Enum `USER` or `ADMIN`; frontend must NOT send this. See security note. |

### Behavior

- Checks whether the email already exists.
- Hashes a generated OTP and stores its expiry (5 minutes).
- Creates the user.
- Sends verification email.
- Password hashing is handled by the user model/schema logic, not by the frontend.

### Response Payload

Controller returns:

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "_id": "USER_ID",
    "firstName": "Wagih",
    "lastName": "Ahmed",
    "email": "user@example.com"
  }
}
```

The global interceptor may wrap this payload in another `data` object. User fields shown are illustrative; actual user serialization follows the User schema.

### Errors

- `400`: duplicate email or DTO validation failure (service currently throws a generic Error for duplicate email; exact HTTP mapping should be checked).
- Validation errors for invalid names, email, password, gender, or unknown fields.

## 2.2 Verify Email

**PATCH** `{{BASE_URL}}/auth/verify-email`
**Auth:** Public
**Content-Type:** `application/json`

### Request Body

```json
{
  "email": "user@example.com",
  "confirmEmailOTP": "123456"
}
```

| Field           | Required | Rules / notes                        |
| --------------- | -------- | ------------------------------------ |
| email           | Yes      | Valid email; trimmed and lowercased. |
| confirmEmailOTP | Yes      | Non-empty string OTP.                |

### Behavior

- Finds the account by email.
- Rejects an already verified account.
- Checks OTP presence and expiry.
- Compares the submitted OTP with the stored hash.
- On success, sets `confirmEmail` and clears OTP and expiry fields.

### Response

```json
{
  "message": "Email verified successfully"
}
```

### Errors

- `404`: account not found.
- `400`: email already verified, OTP missing, OTP expiry missing, OTP expired, or invalid OTP.

## 2.3 Resend Verification OTP

**PATCH** `{{BASE_URL}}/auth/resend-otp`
**Auth:** Public
**Content-Type:** `application/json`

### Request Body

```json
{
  "email": "user@example.com"
}
```

| Field | Required | Rules / notes                        |
| ----- | -------- | ------------------------------------ |
| email | Yes      | Valid email; trimmed and lowercased. |

### Behavior

- Finds the account.
- Generates and hashes a new OTP.
- Sets the new OTP expiry to **1 minute** in the current service.
- Sends the new OTP by email.

### Response

Current service returns:

```json
{
  "message": "Email verified successfully"
}
```

**Implementation note:** This message is misleading for a resend operation; the code currently returns this exact text. Frontend should treat successful HTTP completion as OTP resend, not as email verification.

### Errors

- `404`: account not found.
- DTO validation errors.

## 2.4 Login

**POST** `{{BASE_URL}}/auth/login`
**Auth:** Public
**Content-Type:** `application/json`

### Request Body

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

| Field    | Required | Rules / notes                        |
| -------- | -------- | ------------------------------------ |
| email    | Yes      | Valid email; trimmed and lowercased. |
| password | Yes      | String, 6–20 characters.             |

### Behavior

- Finds a user whose email is verified.
- Compares password with stored hash.
- Generates access and refresh tokens.

### Response

```json
{
  "message": "Login successful",
  "accessToken": "<ACCESS_TOKEN>",
  "refreshToken": "<REFRESH_TOKEN>"
}
```

### Errors

- `404`: user not found or email not verified (current service uses this response).
- `400`: invalid email or password.
- DTO validation errors.

## 2.5 Get Current Profile

**GET** `{{BASE_URL}}/auth/profile`
**Auth:** Authenticated
**Body:** None

### Behavior

Returns the current authenticated user attached by `AuthGuard`. The guard selects out password, OTP hash, and OTP expiry fields.

### Response Payload

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "_id": "USER_ID",
    "firstName": "Wagih",
    "lastName": "Ahmed",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### Errors

- `401`: missing, malformed, expired, or invalid token; user not found; token role mismatch.

## 2.6 Upload / Update Profile Picture

**PATCH** `{{BASE_URL}}/auth/profile-pic`
**Auth:** Authenticated
**Content-Type:** `multipart/form-data`

### Form Data

| Field | Required | Rules / notes                                |
| ----- | -------- | -------------------------------------------- |
| file  | Expected | One image file; jpg/jpeg/png/webp; max 5 MB. |

### Behavior

- Uses the authenticated user's ID.
- Uploads/replaces the profile picture in Cloudinary.
- Saves the returned image metadata on the user.

### Response Payload

```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "user": {
    "_id": "USER_ID",
    "profilePic": {
      "secure_url": "https://...",
      "public_id": "..."
    }
  }
}
```

### Errors

- `401`: unauthorized.
- Upload/file validation or Cloudinary errors.
- **Implementation note:** Controller does not explicitly check that `file` exists before calling the service; frontend must send it.

### Auth Module Notes

- The inspected controller has no refresh-token, logout, forgot-password, or reset-password route.
- Signup DTO currently permits an optional `role` field. This is a security concern: backend should assign `USER` server-side and never trust a client-supplied role. Frontend must omit `role`.

---

# 3. Category Module

Base path: `{{BASE_URL}}/category`

## 3.1 Create Category

**POST** `{{BASE_URL}}/category/create-category`
**Auth:** ADMIN
**Content-Type:** `multipart/form-data`

### Form Data

| Field | Required | Rules / notes                                     |
| ----- | -------- | ------------------------------------------------- |
| name  | Yes      | String, 2–20 characters; trimmed.                 |
| file  | Yes      | Category logo image; jpg/jpeg/png/webp; max 5 MB. |

### Behavior

- Checks that image file exists.
- Uploads logo to Cloudinary folder `ecommerce/categories`.
- Creates category with `createdBy` from authenticated admin.
- Invalidates category Redis cache namespace.

### Response Payload

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "CATEGORY_ID",
    "name": "Electronics",
    "logo": {
      "secure_url": "https://...",
      "public_id": "..."
    }
  }
}
```

### Errors

- `401`: missing/invalid token.
- `403`: non-admin.
- `400`: image missing or invalid file.
- Database/Cloudinary errors.

## 3.2 Get All Categories

**GET** `{{BASE_URL}}/category`
**Auth:** Optional Auth
**Body:** None

### Behavior

- Returns all categories.
- Guest and USER responses may be cached in Redis for 300 seconds.
- ADMIN bypasses Redis cache.
- Cache is invalidated by category create/update/delete.

### Response

Array of category documents. Example:

```json
[
  {
    "_id": "CATEGORY_ID",
    "name": "Electronics",
    "logo": {
      "secure_url": "https://...",
      "public_id": "..."
    }
  }
]
```

### Errors

- If Authorization is supplied but malformed/invalid: `401`.

## 3.3 Get Category By ID

**GET** `{{BASE_URL}}/category/:id`
**Auth:** Optional Auth
**Path Parameters:** `id` — category MongoDB ID.

### Behavior

Calls `findById(id)` and returns the matching category. Current service does not explicitly throw NotFound when category is absent; a missing record may return `null`.

### Response

```json
{
  "_id": "CATEGORY_ID",
  "name": "Electronics",
  "logo": {
    "secure_url": "https://...",
    "public_id": "..."
  }
}
```

### Errors

- `401`: supplied token invalid.
- Invalid/missing IDs are not explicitly validated in this service method; observe actual Mongoose behavior.

## 3.4 Update Category

**PATCH** `{{BASE_URL}}/category/update-category/:id`
**Auth:** ADMIN
**Content-Type:** `multipart/form-data`

### Form Data

| Field | Required | Rules / notes                                       |
| ----- | -------- | --------------------------------------------------- |
| name  | No       | String, 2–20 characters if supplied.                |
| file  | No       | Replacement category logo; same image restrictions. |

### Behavior

- Finds category; throws if not found.
- If `file` is supplied, replaces logo in Cloudinary.
- Updates supplied text fields only.
- Saves category and invalidates category cache.

### Response Payload

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "_id": "CATEGORY_ID",
    "name": "Updated name"
  }
}
```

### Errors

- `401`: unauthorized.
- `403`: non-admin.
- `404`: category not found.
- Validation, upload, or database errors.

## 3.5 Delete Category

**DELETE** `{{BASE_URL}}/category/delete-category/:id`
**Auth:** ADMIN
**Body:** None

### Behavior

- Finds category.
- Deletes its Cloudinary logo if it has `public_id`.
- Deletes category from MongoDB.
- Invalidates category cache.

### Response

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

### Errors

- `401`: unauthorized.
- `403`: non-admin.
- `404`: category not found.
- Cloudinary/database errors.

---

# 4. Brand Module

Base path: `{{BASE_URL}}/brand`

## 4.1 Create Brand

**POST** `{{BASE_URL}}/brand/create-brand`
**Auth:** ADMIN
**Content-Type:** `multipart/form-data`

### Form Data

| Field      | Required | Rules / notes                                                                             |
| ---------- | -------- | ----------------------------------------------------------------------------------------- |
| name       | Yes      | String, 2–20 characters; trimmed.                                                         |
| categories | Yes      | Non-empty array of category Mongo IDs. In multipart send JSON text, e.g. `["ID1","ID2"]`. |
| file       | Yes      | Brand logo; jpg/jpeg/png/webp; max 5 MB.                                                  |

### Behavior

- Requires an image.
- Uploads logo to `ecommerce/brands`.
- Checks that all supplied category IDs exist.
- Creates brand with `createdBy` from authenticated admin.
- Populates `categories` before returning.
- Invalidates brand cache.

### Response Payload

```json
{
  "success": true,
  "message": "Brand created successfully",
  "data": {
    "_id": "BRAND_ID",
    "name": "Brand name",
    "logo": {
      "secure_url": "https://...",
      "public_id": "..."
    },
    "categories": []
  }
}
```

### Errors

- `401`: unauthorized.
- `403`: non-admin.
- `400`: image missing, category IDs invalid/nonexistent, or DTO validation failure.
- Upload/database errors.

## 4.2 Get All Brands

**GET** `{{BASE_URL}}/brand`
**Auth:** Optional Auth
**Body:** None

### Behavior

Returns all brands with `categories` populated. Guest/USER cache TTL is 300 seconds; ADMIN bypasses cache.

### Response

```json
[
  {
    "_id": "BRAND_ID",
    "name": "Brand name",
    "categories": []
  }
]
```

### Errors

- `401` only when an included optional token is invalid.

## 4.3 Get Brand By ID

**GET** `{{BASE_URL}}/brand/:id`
**Auth:** Optional Auth
**Path:** `id` — brand MongoDB ID.

### Behavior

Returns one brand with populated categories. The current service does not explicitly throw NotFound for a missing brand; it may return `null`. Guest/USER cache TTL is 300 seconds.

### Response

```json
{
  "_id": "BRAND_ID",
  "name": "Brand name",
  "categories": []
}
```

### Errors

- `401`: supplied token invalid.
- Invalid ID behavior depends on Mongoose casting; no explicit service validation is present.

## 4.4 Update Brand

**PATCH** `{{BASE_URL}}/brand/update-brand/:id`
**Auth:** ADMIN
**Content-Type:** `multipart/form-data`

### Form Data

| Field      | Required | Rules / notes                                                                |
| ---------- | -------- | ---------------------------------------------------------------------------- |
| name       | No       | String, 2–20 characters.                                                     |
| categories | No       | Non-empty array of existing category IDs, encoded as JSON text in multipart. |
| file       | No       | Replacement logo image.                                                      |

### Behavior

- Finds brand.
- If categories are supplied, validates all category IDs and replaces category references.
- Updates name only if supplied.
- Replaces logo only if a new file is supplied.
- Saves and populates categories.
- Invalidates brand cache.

### Response

Updated brand document with populated categories.

### Errors

- `401`: unauthorized.
- `403`: non-admin.
- `404`: brand not found.
- `400`: one or more categories do not exist / validation errors.
- Upload/database errors.

## 4.5 Delete Brand

**DELETE** `{{BASE_URL}}/brand/delete-brand/:id`
**Auth:** ADMIN
**Body:** None

### Behavior

Finds brand, deletes logo from Cloudinary if present, deletes brand from MongoDB, invalidates brand cache.

### Response

```json
{
  "success": true,
  "message": "Brand deleted successfully"
}
```

### Errors

- `401`: unauthorized.
- `403`: non-admin.
- `404`: brand not found.

---

# 5. Product Module

Base path: `{{BASE_URL}}/product`

## 5.1 Create Product

**POST** `{{BASE_URL}}/product/create-product`
**Auth:** ADMIN
**Content-Type:** `multipart/form-data`

### Form Data

| Field       | Required   | Rules / notes                                 |
| ----------- | ---------- | --------------------------------------------- |
| name        | Yes        | String, 2–100 characters; trimmed.            |
| description | Yes        | String, 10–500 characters; trimmed.           |
| price       | Yes        | Number >= 0.                                  |
| stock       | Yes        | Number >= 0.                                  |
| discount    | Yes in DTO | Number from 0 to 100.                         |
| category    | Yes        | Existing category Mongo ID.                   |
| brand       | Yes        | Existing brand Mongo ID.                      |
| images      | Yes        | 1–5 image files, field name exactly `images`. |

### Behavior

- Requires at least one image.
- Checks category and brand existence.
- Creates a product ObjectId and uploads images to `ecommerce/products/<productId>`.
- Creates product with admin `createdBy`.
- Populates category and brand.
- Invalidates product cache.

### Response Payload

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "PRODUCT_ID",
    "name": "Product name",
    "description": "Product description",
    "price": 1000,
    "stock": 10,
    "discount": 10,
    "images": [],
    "category": {},
    "brand": {}
  }
}
```

### Errors

- `401`: unauthorized.
- `403`: non-admin.
- `400`: no images, category not found, brand not found, invalid field values/files.
- Database/Cloudinary errors.

## 5.2 Get All Products

**GET** `{{BASE_URL}}/product`
**Auth:** Optional Auth
**Body:** None

### Behavior

Returns all products populated with `category` and `brand`. Guest/USER cache TTL is 300 seconds; ADMIN bypasses cache.

### Response

```json
[
  {
    "_id": "PRODUCT_ID",
    "name": "Product name",
    "price": 1000,
    "stock": 10,
    "discount": 10,
    "images": [],
    "category": {},
    "brand": {}
  }
]
```

### Query Parameters

No pagination, search, sort, or filter query DTO is currently wired to this route.

### Errors

- `401`: supplied optional token invalid.

## 5.3 Get Product By ID

**GET** `{{BASE_URL}}/product/:id`
**Auth:** Optional Auth
**Path:** `id` — product MongoDB ID.

### Behavior

- Validates MongoDB ObjectId.
- Finds product and populates category and brand.
- Guest/USER cache TTL is 300 seconds.

### Response

Single populated product document.

### Errors

- `400`: invalid product ID.
- `404`: product not found.
- `401`: supplied optional token invalid.

## 5.4 Update Product

**PATCH** `{{BASE_URL}}/product/update-product/:id`
**Auth:** ADMIN
**Content-Type:** `multipart/form-data`

### Form Data

| Field       | Required | Rules / notes                                    |
| ----------- | -------- | ------------------------------------------------ |
| name        | No       | String, 2–100 characters.                        |
| description | No       | String, 10–500 characters.                       |
| price       | No       | Number >= 0.                                     |
| stock       | No       | Number >= 0.                                     |
| discount    | No       | Number 0–100.                                    |
| category    | No       | Existing category Mongo ID.                      |
| brand       | No       | Existing brand Mongo ID.                         |
| images      | No       | Up to 5 replacement images, field name `images`. |

### Behavior

- Validates product ID and product existence.
- Validates category/brand if supplied.
- Updates only fields sent.
- If no new images are uploaded, existing images are retained.
- If new images are supplied, uploads them to the product folder, saves product, then deletes old Cloudinary images.
- Populates category and brand.
- Invalidates product cache.

### Response Payload

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "PRODUCT_ID",
    "name": "Updated product"
  }
}
```

### Errors

- `400`: invalid product ID, invalid values, category/brand validation.
- `401`: unauthorized.
- `403`: non-admin.
- `404`: product/category/brand not found.
- Upload/database errors.

## 5.5 Delete Product

**DELETE** `{{BASE_URL}}/product/delete-product/:id`
**Auth:** ADMIN
**Body:** None

### Behavior

Validates ID, finds product, deletes associated Cloudinary images, deletes product, and invalidates product cache.

### Response

```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {}
}
```

`data` represents the service deletion result; exact value follows the implementation.

### Errors

- `400`: invalid product ID.
- `401`: unauthorized.
- `403`: non-admin.
- `404`: product not found.
- Cloudinary/database errors.

---

# 6. Cart Module

Base path: `{{BASE_URL}}/cart`
All routes use `AuthGuard`; cart operations are scoped to the authenticated user. No user ID should be sent by the frontend.

## 6.1 Add Item To Cart

**POST** `{{BASE_URL}}/cart/add-to-cart`
**Auth:** Authenticated
**Content-Type:** `application/json`

### Request Body

```json
{
  "productId": "PRODUCT_ID",
  "quantity": 2
}
```

| Field     | Required | Rules / notes             |
| --------- | -------- | ------------------------- |
| productId | Yes      | Valid MongoDB Product ID. |
| quantity  | Yes      | Integer >= 1.             |

### Behavior

- Finds product.
- Checks requested quantity against available stock.
- Finds or creates the user's cart.
- If product is already in cart, adds quantity to current quantity and checks combined quantity against stock.
- If new item, calculates discounted unit price using the product's current discount.
- Recalculates cart totals and coupon discount.
- Saves cart and populates `items.product` and `appliedCoupon`.

### Response

Cart document containing items, totalPrice, discountAmount, finalTotal, and appliedCoupon.

### Errors

- `401`: missing/invalid token.
- `404`: product not found.
- `400`: insufficient stock or invalid DTO.

## 6.2 Get Current Cart

**GET** `{{BASE_URL}}/cart`
**Auth:** Authenticated
**Body:** None

### Behavior

- Finds the current user's cart.
- If none exists, creates an empty cart document in memory and saves it.
- Recalculates totals and validates applied coupon.
- Populates `items.product` and `appliedCoupon`.

### Response Example

```json
{
  "items": [],
  "totalPrice": 0,
  "discountAmount": 0,
  "finalTotal": 0,
  "appliedCoupon": null
}
```

### Errors

- `401`: missing/invalid token.
- Database/coupon lookup errors.

## 6.3 Update Cart Item Quantity

**PATCH** `{{BASE_URL}}/cart/update-cart/:productId`
**Auth:** Authenticated
**Content-Type:** `application/json`

### Request Body

```json
{
  "quantity": 3
}
```

| Field            | Required | Rules / notes       |
| ---------------- | -------- | ------------------- |
| productId (path) | Yes      | Product MongoDB ID. |
| quantity         | Yes      | Integer >= 1.       |

### Behavior

- Validates product ID.
- Finds current user's cart and item.
- Finds product and checks requested quantity against current stock.
- Updates quantity, recalculates totals, saves, and populates relations.

### Errors

- `400`: invalid ID, insufficient stock, invalid quantity.
- `401`: unauthorized.
- `404`: cart/product/product-in-cart not found.

## 6.4 Remove Item From Cart

**DELETE** `{{BASE_URL}}/cart/remove-item/:productId`
**Auth:** Authenticated
**Body:** None

### Behavior

- Validates product ID.
- Finds current user's cart.
- Finds item and removes it.
- Recalculates totals and saves cart.
- Populates products and applied coupon.

### Errors

- `400`: invalid product ID.
- `401`: unauthorized.
- `404`: cart not found or product not found in cart.

---

# 7. Review Module

Base path: `{{BASE_URL}}/review`

## 7.1 Create Review

**POST** `{{BASE_URL}}/review/create-review`
**Auth:** Authenticated
**Content-Type:** `application/json`

### Request Body

```json
{
  "rating": 5,
  "comment": "Excellent product",
  "productId": "PRODUCT_ID"
}
```

| Field     | Required | Rules / notes             |
| --------- | -------- | ------------------------- |
| rating    | Yes      | Integer from 1 to 5.      |
| comment   | Yes      | Non-empty string.         |
| productId | Yes      | Valid MongoDB Product ID. |

### Behavior

- Checks product existence.
- Checks if current user already reviewed this product.
- Creates review associated with authenticated user and product.
- Populates user summary and product.

### Response

Review document with populated `user` (`firstName`, `lastName`, `email`) and `product`.

### Errors

- `401`: unauthorized.
- `404`: product does not exist.
- `409`: user already reviewed this product.
- `400`: DTO validation failure.

## 7.2 Get All Reviews

**GET** `{{BASE_URL}}/review`
**Auth:** Public
**Body:** None

### Behavior

Returns all reviews with user summary and product populated.

### Response

Array of review documents.

### Errors

No explicit pagination or query filters are implemented in the controller.

## 7.3 Get Review By ID

**GET** `{{BASE_URL}}/review/:id`
**Auth:** Public
**Path:** `id` — review MongoDB ID.

### Behavior

Validates ID, finds review, populates user summary and product.

### Errors

- `400`: invalid review ID.
- `404`: review not found.

## 7.4 Update Review

**PATCH** `{{BASE_URL}}/review/update-review/:id`
**Auth:** Authenticated; owner only
**Content-Type:** `application/json`

### Request Body

```json
{
  "rating": 4,
  "comment": "Updated review text"
}
```

| Field     | Required    | Rules / notes                  |
| --------- | ----------- | ------------------------------ |
| rating    | No          | If supplied, integer 1–5.      |
| comment   | No          | If supplied, non-empty string. |
| productId | Not allowed | Update DTO omits productId.    |

### Behavior

- Validates review ID.
- Finds review.
- Checks current user owns review.
- Updates supplied rating/comment only.
- Saves and populates user and product.

### Errors

- `400`: invalid review ID or DTO validation failure.
- `401`: unauthorized.
- `403`: current user is not review owner.
- `404`: review not found.

## 7.5 Delete Review

**DELETE** `{{BASE_URL}}/review/delete-review/:id`
**Auth:** Authenticated; owner only
**Body:** None

### Behavior

Validates ID, finds review, checks ownership, deletes review.

### Response

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

### Errors

- `400`: invalid review ID.
- `401`: unauthorized.
- `403`: current user is not review owner.
- `404`: review not found.

---

# 8. Coupon Module

Base path: `{{BASE_URL}}/coupon`

## 8.1 Create Coupon

**POST** `{{BASE_URL}}/coupon/create-coupon`
**Auth:** ADMIN
**Content-Type:** `application/json`

### Request Body

```json
{
  "code": "SAVE10",
  "discountPercentage": 10,
  "usageLimit": 100,
  "startDate": "2026-11-01T00:00:00.000Z",
  "expiryDate": "2026-12-01T00:00:00.000Z",
  "isActive": true
}
```

| Field              | Required            | Rules / notes                               |
| ------------------ | ------------------- | ------------------------------------------- |
| code               | Yes                 | String, 3–30 chars; trimmed and uppercased. |
| discountPercentage | Yes                 | Integer 1–100.                              |
| usageLimit         | No                  | Integer >= 1.                               |
| startDate          | Yes                 | Valid date string.                          |
| expiryDate         | Yes                 | Valid date string; must be after startDate. |
| isActive           | No                  | Boolean.                                    |
| usageCount         | No / server-managed | Do not send; defaults to 0.                 |
| usedBy             | No / server-managed | Do not send.                                |
| createdBy          | No / server-managed | Derived from authenticated admin.           |

### Behavior

- Validates date ordering.
- Normalizes coupon code.
- Checks duplicate code.
- Creates coupon with admin creator ID.
- Populates creator details.
- Handles duplicate-key error as conflict.

### Response

Coupon document with `createdBy` populated with creator email and name.

### Errors

- `400`: invalid date ordering or DTO validation failure.
- `401`: unauthorized.
- `403`: non-admin.
- `409`: coupon code already exists.

## 8.2 Validate Coupon

**POST** `{{BASE_URL}}/coupon/validate-coupon`
**Auth:** Authenticated
**Content-Type:** `application/json`

### Request Body

```json
{
  "code": "SAVE10"
}
```

| Field | Required | Rules / notes                                              |
| ----- | -------- | ---------------------------------------------------------- |
| code  | Yes      | Non-empty string; normalized uppercase/trimmed in service. |

### Behavior

- Validates user ID and coupon code.
- Finds coupon.
- Checks active state, start/expiry dates, usage limit, and whether current user already used it.
- Requires user's cart to exist and contain items.
- Calculates discount against cart `totalPrice`.
- Does not itself apply coupon to cart.

### Response

```json
{
  "valid": true,
  "message": "Coupon is valid",
  "coupon": {
    "code": "SAVE10",
    "discountPercentage": 10
  },
  "pricing": {
    "cartTotal": 1000,
    "discountAmount": 100,
    "finalTotal": 900
  }
}
```

### Errors

- `400`: invalid user ID, missing code, inactive/not-started/expired coupon, usage limit reached, already used, or empty cart.
- `401`: unauthorized.
- `404`: coupon not found.

## 8.3 Apply Coupon To Cart

**POST** `{{BASE_URL}}/coupon/apply-coupon`
**Auth:** Authenticated
**Content-Type:** `application/json`

### Request Body

```json
{
  "code": "SAVE10"
}
```

### Behavior

- Calls coupon validation first.
- Finds user's cart and coupon.
- Sets `appliedCoupon`, `discountAmount`, and `finalTotal`.
- Saves cart.

### Response

```json
{
  "message": "Coupon applied to cart successfully",
  "cart": {}
}
```

### Errors

- Same validation errors as Validate Coupon.
- `404`: cart or coupon not found.
- `401`: unauthorized.

## 8.4 Remove Coupon From Cart

**DELETE** `{{BASE_URL}}/coupon/remove-coupon`
**Auth:** Authenticated
**Body:** None

### Behavior

- Validates authenticated user ID.
- Finds user's cart.
- Requires an applied coupon.
- Clears appliedCoupon and resets discountAmount to 0 and finalTotal to totalPrice.
- Saves cart.

### Response

```json
{
  "message": "Coupon removed successfully",
  "cart": {}
}
```

### Errors

- `400`: invalid user ID or no coupon applied.
- `401`: unauthorized.
- `404`: cart not found.

## 8.5 Get All Coupons

**GET** `{{BASE_URL}}/coupon`
**Auth:** ADMIN
**Body:** None

### Behavior

Returns all coupons with `createdBy` populated (`email`, `firstName`, `lastName`).

### Response

Array of coupon documents.

### Errors

- `401`: unauthorized.
- `403`: non-admin.

## 8.6 Get Coupon By ID

**GET** `{{BASE_URL}}/coupon/:id`
**Auth:** ADMIN
**Path:** `id` — coupon MongoDB ID.

### Behavior

Validates MongoDB ID, finds coupon, populates creator.

### Errors

- `400`: invalid coupon ID.
- `401`: unauthorized.
- `403`: non-admin.
- `404`: coupon not found.

## 8.7 Update Coupon

**PATCH** `{{BASE_URL}}/coupon/update-coupon/:id`
**Auth:** ADMIN
**Content-Type:** `application/json`

### Request Body

All fields are optional:

```json
{
  "code": "SAVE15",
  "discountPercentage": 15,
  "usageLimit": 150,
  "startDate": "2026-11-01T00:00:00.000Z",
  "expiryDate": "2026-12-15T00:00:00.000Z",
  "isActive": true
}
```

| Field              | Required | Rules / notes                                                               |
| ------------------ | -------- | --------------------------------------------------------------------------- |
| code               | No       | 3–30 chars; normalized uppercase. Cannot change after coupon has been used. |
| discountPercentage | No       | Integer 1–100.                                                              |
| usageLimit         | No       | Integer >= 1; cannot be less than current usageCount.                       |
| startDate          | No       | Valid date string.                                                          |
| expiryDate         | No       | Valid date string; must remain after startDate.                             |
| isActive           | No       | Boolean.                                                                    |

### Behavior

- Validates ID and coupon existence.
- Normalizes code if provided.
- Prevents code change after use.
- Checks duplicate code.
- Validates resulting date range and usage limit.
- Assigns supplied fields and saves.
- Populates creator.
- Converts duplicate key errors to conflict.

### Errors

- `400`: invalid ID, date range, code change after use, usage limit below current count, or DTO validation failure.
- `401`: unauthorized.
- `403`: non-admin.
- `404`: coupon not found.
- `409`: duplicate code.

## 8.8 Delete Coupon

**DELETE** `{{BASE_URL}}/coupon/delete-coupon/:id`
**Auth:** ADMIN
**Body:** None

### Behavior

- Validates ID and finds coupon.
- Finds carts referencing this coupon.
- Removes coupon from those carts and resets discount values.
- Deletes coupon document.

### Response

```json
{
  "message": "Coupon deleted successfully"
}
```

### Errors

- `400`: invalid coupon ID.
- `401`: unauthorized.
- `403`: non-admin.
- `404`: coupon not found.

---

# 9. Order Module

Base path: `{{BASE_URL}}/order`

## 9.1 Create Order

**POST** `{{BASE_URL}}/order/create-order`
**Auth:** Authenticated
**Content-Type:** `application/json`

### Request Body

```json
{
  "items": [
    {
      "product": "PRODUCT_OBJECT_ID",
      "quantity": 2
    },
    {
      "product": "ANOTHER_PRODUCT_OBJECT_ID",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "fullName": "Customer Name",
    "phone": "01000000000",
    "address": "Street and building details",
    "city": "Cairo"
  },
  "couponCode": "SAVE10",
  "paymentMethod": "CASH",
  "notes": "Please call before delivery"
}
```

| Field                    | Required | Rules / notes                                               |
| ------------------------ | -------- | ----------------------------------------------------------- |
| items                    | Yes      | Non-empty array.                                            |
| items[].product          | Yes      | Valid MongoDB Product ID.                                   |
| items[].quantity         | Yes      | Integer, minimum 1.                                         |
| shippingAddress.fullName | Yes      | Non-empty string.                                           |
| shippingAddress.phone    | Yes      | Non-empty string.                                           |
| shippingAddress.address  | Yes      | Non-empty string.                                           |
| shippingAddress.city     | Yes      | Non-empty string.                                           |
| couponCode               | No       | Non-empty string if supplied; normalized uppercase/trimmed. |
| paymentMethod            | Yes      | `CASH` or `CARD`.                                           |
| notes                    | No       | String, maximum 500 characters.                             |

### Behavior

- Fetches requested products and verifies all unique product IDs exist.
- Merges repeated product IDs into a combined quantity.
- Checks current stock availability.
- Calculates each unit price after product-level discount.
- Saves product snapshots (product reference, name, first image, discounted unit price, quantity, item subtotal).
- Validates optional coupon and calculates order-level discount.
- Current shipping cost is 0.
- Calculates order total on the server.
- Creates order as `PENDING`.
- **Stock is checked but not reserved/deducted at creation.** Stock deduction and coupon usage consumption happen on confirmation.

### Response

Returns created order document. Example fields:

```json
{
  "_id": "ORDER_ID",
  "orderStatus": "PENDING",
  "paymentStatus": "PENDING",
  "paymentMethod": "CASH",
  "subtotal": 2000,
  "shippingCost": 0,
  "discount": 200,
  "total": 1800,
  "items": [],
  "shippingAddress": {}
}
```

### Errors

- `400`: invalid/missing product IDs, insufficient stock, invalid/expired/used coupon, usage limit reached, or DTO validation failure.
- `401`: unauthorized.
- `404`: product or coupon not found.

## 9.2 Confirm Order

**POST** `{{BASE_URL}}/order/confirm-order/:id`
**Auth:** ADMIN
**Body:** None

### Behavior

- Validates order ID.
- Runs confirmation in a MongoDB transaction.
- Only `PENDING` orders can be confirmed.
- Rejects an order whose stock has already been deducted.
- For every order item, performs a conditional stock decrement only if available stock is at least the requested quantity.
- Revalidates coupon at confirmation time and atomically increments coupon usage/adds user to `usedBy`.
- Sets `orderStatus=CONFIRMED`, `confirmedAt`, and `stockDeductedAt`.
- If any operation fails, transaction aborts and previous writes are rolled back.
- Does not set `paymentStatus=PAID`.

### Response

Returns updated order document.

### Errors

- `400`: invalid ID, order not pending, stock already deducted, insufficient stock, coupon no longer valid/available, or confirmation failed.
- `401`: unauthorized.
- `403`: non-admin.
- `404`: order or coupon not found.
- Transaction requires MongoDB replica set or sharded cluster; standalone MongoDB does not support multi-document transactions.

## 9.3 Cancel Order

**PATCH** `{{BASE_URL}}/order/cancel/:id`
**Auth:** Authenticated
**Body:** None

### Authorization and Allowed Statuses

| Role  | Allowed statuses                         |
| ----- | ---------------------------------------- |
| USER  | `PENDING`, `CONFIRMED` — own order only. |
| ADMIN | `PENDING`, `CONFIRMED`, `PROCESSING`.    |

### Behavior

- Validates order ID and finds order.
- Checks owner/admin authorization.
- Rejects disallowed status transitions.
- Uses transaction to change order to `CANCELLED`.
- If stock was deducted, restores item quantities to product stock.
- If coupon usage was consumed, decrements `usageCount` and removes user from `usedBy`.
- If a step fails, transaction rolls back.
- Current cancellation implementation does not issue payment refunds.

### Response

Returns cancelled order document.

### Errors

- `400`: invalid ID, disallowed status, inconsistent stock deduction state, restore failure.
- `401`: unauthorized.
- `403`: user does not own order.
- `404`: order/product not found.
- Transaction errors.

## 9.4 Get My Orders

**GET** `{{BASE_URL}}/order/my-orders?page=1&limit=10`
**Auth:** Authenticated
**Body:** None

### Query Parameters

| Parameter | Required | Default / rules            |
| --------- | -------- | -------------------------- |
| page      | No       | Default 1; integer >= 1.   |
| limit     | No       | Default 10; integer 1–100. |

### Behavior

- Derives user ID from token.
- Filters orders by current user.
- Sorts newest first.
- Applies pagination.
- Runs order query and count query.

### Response Shape

```json
{
  "success": true,
  "data": [
    {
      "_id": "ORDER_ID",
      "orderStatus": "PENDING",
      "paymentStatus": "PENDING",
      "total": 1800,
      "createdAt": "2026-11-18T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

Order entries above are abbreviated. Global response interceptor may wrap the returned object under an outer `data`.

### Errors

- `401`: unauthorized.
- Query validation errors.

## 9.5 Get Order By ID

**GET** `{{BASE_URL}}/order/:id`
**Auth:** Authenticated

### Behavior

- Validates order ID.
- USER can retrieve only their own order.
- ADMIN can retrieve any order.
- Finds order by ID plus owner filter for USER.

### Response Shape

```json
{
  "success": true,
  "data": {
    "_id": "ORDER_ID",
    "orderStatus": "CONFIRMED",
    "paymentStatus": "PENDING",
    "total": 1800
  }
}
```

### Errors

- `400`: invalid order ID.
- `401`: unauthorized.
- `404`: order not found or user does not own it.

## 9.6 Admin: Get All Orders

**GET** `{{BASE_URL}}/order?page=1&limit=10&status=CONFIRMED`
**Auth:** ADMIN
**Body:** None

### Query Parameters

| Parameter | Required | Default / rules                                   |
| --------- | -------- | ------------------------------------------------- |
| page      | No       | Default 1; integer >= 1.                          |
| limit     | No       | Default 10; integer 1–100.                        |
| status    | No       | One of OrderStatus enum values.                   |
| fromDate  | No       | ISO date string; inclusive createdAt lower bound. |
| toDate    | No       | ISO date string; inclusive createdAt upper bound. |

### Supported Status Values

`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`.

### Examples

```http
GET {{BASE_URL}}/order?page=1&limit=10
GET {{BASE_URL}}/order?status=PENDING
GET {{BASE_URL}}/order?fromDate=2026-11-01T00:00:00.000Z&toDate=2026-11-18T23:59:59.999Z
GET {{BASE_URL}}/order?status=CONFIRMED&page=2&limit=5
```

### Behavior

- Validates fromDate is not later than toDate.
- Filters by status and/or createdAt range.
- Sorts newest first.
- Applies pagination and returns total count.

### Response

Same `data` and `pagination` structure as Get My Orders.

### Errors

- `400`: invalid query values or fromDate later than toDate.
- `401`: unauthorized.
- `403`: non-admin.

## Order Model Reference

| Field                 | Type        | Description                                                    |
| --------------------- | ----------- | -------------------------------------------------------------- |
| _id                   | string      | MongoDB order ID.                                              |
| user                  | ID          | Order owner.                                                   |
| items                 | array       | Product snapshots.                                             |
| items[].product       | ID          | Product reference.                                             |
| items[].name          | string      | Product name snapshot.                                         |
| items[].image         | object      | First product image snapshot in create logic.                  |
| items[].price         | number      | Unit price after product discount.                             |
| items[].quantity      | number      | Ordered quantity.                                              |
| items[].subtotal      | number      | Unit price × quantity.                                         |
| shippingAddress       | object      | fullName, phone, address, city.                                |
| coupon                | object/null | Coupon reference, code snapshot, discountAmount.               |
| subtotal              | number      | Sum of item subtotals.                                         |
| shippingCost          | number      | Currently 0.                                                   |
| discount              | number      | Coupon discount amount.                                        |
| total                 | number      | subtotal + shippingCost - discount, minimum 0.                 |
| paymentMethod         | enum        | CASH or CARD.                                                  |
| paymentStatus         | enum        | PENDING, PAID, FAILED, REFUNDED.                               |
| orderStatus           | enum        | PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED. |
| confirmedAt           | date/null   | Confirmation timestamp.                                        |
| stockDeductedAt       | date/null   | Stock deduction timestamp.                                     |
| notes                 | string      | Optional; max 500 chars.                                       |
| cancelledAt           | date/null   | Cancellation timestamp.                                        |
| createdAt / updatedAt | date        | Mongoose timestamps.                                           |

---

# 10. Root / Health Route

## Get Application Root

**GET** `{{BASE_URL}}/`
**Auth:** Public
**Body:** None

### Behavior

Returns the application greeting string from `AppService`.

### Response

A plain string / greeting response, according to the current AppController.

---

# 11. Frontend Integration Flow

## Authentication

1. Sign up.
2. Verify email using OTP.
3. Login and store access token securely.
4. Send `Authorization: Bearer <access_token>` on protected calls.
5. Fetch profile using `/auth/profile`.

## Catalog

1. Fetch categories and brands.
2. Fetch product list.
3. Fetch product details by ID.
4. Admin can create/update/delete catalog resources.

## Cart and Coupon

1. Add products to cart.
2. Fetch cart.
3. Update/remove cart items.
4. Validate coupon.
5. Apply or remove coupon.

## Reviews

1. Submit review for product.
2. Fetch public reviews.
3. Owner can update/delete own review.

## Orders

1. Create order from checkout data.
2. Fetch customer order history.
3. Fetch order details.
4. Admin lists and confirms orders.
5. User/admin cancels only when role/status rules allow.
6. Read `orderStatus` and `paymentStatus` separately.

---

# 12. Important Implementation Notes / Verify Before Release

1. **Authorization format:** current source uses `Bearer <token>`, not role-prefixed token text.
2. **Signup role:** current signup DTO includes optional `role`. Backend should not accept ADMIN role from public signup; assign USER server-side.
3. **Refresh/logout:** login returns a refresh token, but no refresh or logout endpoint exists in the inspected AuthController.
4. **Email resend message:** resend OTP service currently responds with `"Email verified successfully"`; this wording should be corrected.
5. **Global response wrapper:** `TransformInterceptor` wraps successful responses; controller methods that already return `success/data` objects can be nested.
6. **Category/Brand single GET:** their current service methods do not explicitly throw NotFound for missing documents.
7. **Product GET:** no list pagination/filtering is currently exposed by ProductController.
8. **Image uploads:** accepted image types and 5 MB limit are configured in Multer.
9. **Redis cache:** Category, Brand, Product GET endpoints use optional auth and a 300-second TTL for Guest/USER. ADMIN bypasses cache. Mutations invalidate their module namespace.
10. **Order stock:** create checks stock but does not reserve it. Confirmation performs transactional deduction.
11. **Order payment:** confirming an order does not mean payment is complete; paymentStatus is independent.
12. **Mongo transactions:** Order confirm/cancel need MongoDB replica set or sharded cluster.
13. **No invented endpoints:** this guide lists routes found in the inspected controllers. It does not add endpoints merely because a frontend might normally need them.

---

# 13. Source Files Reviewed

- Feature controllers: Auth, Category, Brand, Product, Cart, Review, Coupon, Order.
- Feature DTOs: signup/login/OTP, category, brand, product, cart, review, coupon, order, order query.
- Relevant services: Auth, Category, Brand, Product, Cart, Review, Coupon, Order.
- Guards: AuthGuard, OptionalAuthGuard, AdminGuard.
- Global validation/response behavior and Multer upload configuration.
- Enums: Role, OrderStatus, PaymentMethod, PaymentStatus.
- Main application configuration and module registration.

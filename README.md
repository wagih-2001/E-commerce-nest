# Portfolio Backend API

A production-oriented backend API built with **NestJS, TypeScript, MongoDB, and Mongoose**.

This project is being developed as a complete backend system with authentication, authorization, file uploads, Cloudinary integration, and ecommerce-related modules.

---

## 🚀 Tech Stack

- **Node.js**
- **NestJS**
- **TypeScript**
- **MongoDB**
- **Mongoose**
- **JWT Authentication**
- **Cloudinary**
- **Multer**
- **Class Validator**
- **Class Transformer**

---

## ✨ Features

### Authentication & Authorization

- User Registration
- Password Hashing
- Mongoose Hooks
- Email Verification using OTP
- Resend OTP
- Login
- Access & Refresh Tokens
- JWT Authentication Guard
- Admin Guard
- Protected Routes
- Get Current User Profile

### File Uploads

- Multer integration
- Single image upload
- Multiple image upload
- Image validation
- File size validation
- Cloudinary image storage
- Image replacement
- Image deletion

### Ecommerce Modules

- Category CRUD
- Brand CRUD
- Product CRUD
- Cart Management
- Review Management

---

## 📋 Project Progress

### Authentication

- [x] ENV Setup
- [x] DB Connection
- [x] User Model
- [x] Hashing & Mongoose Hooks
- [x] Signup
- [x] Sending & Confirm Email With OTP
- [x] Resend OTP
- [x] Token Service & Login
- [x] Guard & AuthGuard
- [x] Get Profile

### NestJS Features

- [x] Nest Middlewares
- [x] Nest Interceptors
- [x] Multer & Upload File & Files

### Ecommerce

- [x] Category Module (CRUD)
- [x] Brand Module (CRUD)
- [x] Product Module (CRUD)
- [x] Cart Module (CRUD)
- [x] Review Module (CRUD)

---

## 🏗️ Architecture

The project follows a modular NestJS structure.

Each feature is separated into its own module containing its:

- Controller
- Service
- DTOs
- Schemas / Models
- Guards when needed

Example:

```text
src/
├── auth/
├── user/
├── category/
├── brand/
├── product/
├── cart/
├── review/
└── common/
    ├── guards/
    ├── interceptors/
    ├── middlewares/
    ├── services/
    └── schemas/
```

---

## 🔐 Authentication Flow

The authentication system uses:

```text
Signup
   ↓
Email OTP Verification
   ↓
Login
   ↓
Access Token + Refresh Token
   ↓
AuthGuard
   ↓
Protected Routes
```

Admin-only operations are protected using role-based authorization.

---

## 🛒 Cart Flow

The cart belongs to the authenticated user.

Cart operations include:

- Add product to cart
- Increase existing product quantity
- Update product quantity
- Remove product from cart
- Calculate item subtotal
- Calculate total cart price
- Validate product stock

Product prices are calculated on the backend rather than trusted from the client.

---

## ⭐ Review Flow

Users can create reviews for products.

Each review contains:

- User
- Product
- Rating
- Comment
- Created/Updated timestamps

Review permissions:

```text
GET Reviews       → Public
GET Review        → Public

CREATE Review     → Authenticated User
UPDATE Review     → Review Owner
DELETE Review     → Review Owner
```

---

## ☁️ Cloudinary

Images are uploaded to Cloudinary instead of being stored directly on the server.

The database stores:

```json
{
  "secure_url": "https://...",
  "public_id": "..."
}
```

This allows images to be:

- Uploaded
- Replaced
- Deleted

without storing image files inside the application server.

---

## ⚙️ Environment Variables

Create a configuration file containing the required environment variables.

Example:

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

ACCESS_TOKEN_EXPIRES_IN=86400
REFRESH_TOKEN_EXPIRES_IN=604800

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> Never commit your real environment variables or secrets to GitHub.

---

## 🛠️ Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Install dependencies:

```bash
npm install
```

Create your environment configuration.

Then run the development server:

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000
```

---

## 📌 Current Status

The core authentication and ecommerce modules are currently implemented.

The project is still under active development and additional backend features will be added progressively.

---

## 👨‍💻 Author

**Wagih Ahmed**

Frontend / Full-Stack Developer

- React
- Next.js
- Node.js
- NestJS
- MongoDB
- TypeScript

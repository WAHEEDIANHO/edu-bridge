# Authentication System Documentation

## Overview

The EduBridge application uses a JWT-based authentication system with static HTML pages for login and registration. This document describes the authentication flow, components, and how to use them.

## Authentication Flow

1. **Landing Page**: Users first arrive at the index page, which checks for an existing authentication token and redirects accordingly.
2. **Login**: Users enter their credentials (email and password) to authenticate.
3. **Registration**: New users can create an account with required information.
4. **Token Storage**: Upon successful login, a JWT token is stored in the browser's localStorage.
5. **Protected Routes**: API endpoints are protected using the AuthGuard, which validates the JWT token.

## Components

### Backend Components

1. **AuthController**: Handles authentication endpoints
   - `POST /api/auth/login`: Authenticates users and returns a JWT token
   - `GET /api/auth/google`: Initiates Google OAuth authentication
   - `POST /api/auth/forgot-password`: Handles password reset requests
   - `POST /api/auth/verify-forgot-password`: Verifies OTP and resets password

2. **AuthService**: Implements authentication logic
   - Validates user credentials
   - Generates JWT tokens
   - Handles OTP generation and verification for password reset

3. **AuthGuard**: Protects API endpoints
   - Extracts JWT token from request headers
   - Validates token and adds user information to the request

4. **UserController**: Handles user registration
   - `POST /api/user`: Creates a new user account

### Frontend Components

1. **index.html**: Landing page that redirects based on authentication status
   - Checks for existing token in localStorage
   - Redirects to dashboard if authenticated, login page if not

2. **login.html**: Login page
   - Form for email and password
   - Submits to `/api/auth/login` endpoint
   - Stores JWT token in localStorage upon success
   - Redirects to dashboard after successful login

3. **register.html**: Registration page
   - Form for user details (name, email, password, etc.)
   - Submits to `/api/user` endpoint
   - Redirects to login page after successful registration

## How to Use

### Login

1. Navigate to `/static/login.html`
2. Enter your email and password
3. Click "Login"
4. Upon successful login, you'll be redirected to the dashboard

### Registration

1. Navigate to `/static/register.html`
2. Fill in all required fields:
   - First Name
   - Last Name
   - Email
   - Password (must include uppercase, lowercase, number, and special character)
   - Gender
   - Role (Student or Teacher)
3. Click "Register"
4. Upon successful registration, you'll be redirected to the login page

### Password Reset

1. On the login page, click "Forgot Password" (to be implemented)
2. Enter your email address
3. Check your email for an OTP
4. Enter the OTP and your new password
5. Upon successful password reset, you'll be redirected to the login page

## Token Management

The authentication system uses JWT tokens stored in localStorage:

- **Storage**: `localStorage.setItem('auth_token', token)`
- **Retrieval**: `localStorage.getItem('auth_token')`
- **Removal**: `localStorage.removeItem('auth_token')` (for logout)

Tokens are included in API requests as a Bearer token in the Authorization header:

```javascript
fetch('/api/protected-endpoint', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
})
```

## Security Considerations

1. **HTTPS**: Always use HTTPS in production to protect credentials and tokens
2. **XSS Protection**: The application should implement measures against cross-site scripting
3. **CSRF Protection**: Consider implementing CSRF protection for sensitive operations
4. **Token Expiration**: JWT tokens have an expiration time, after which users must re-authenticate

## Future Improvements

1. **Remember Me**: Add option to keep users logged in for longer periods
2. **Multi-factor Authentication**: Implement additional security layers
3. **OAuth Integration**: Add more social login options (already supports Google)
4. **Session Management**: Allow users to view and manage active sessions
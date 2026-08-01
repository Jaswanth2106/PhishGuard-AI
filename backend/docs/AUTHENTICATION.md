# Authentication

PhishGuard AI uses stateless JWT bearer authentication for private API endpoints.

## Endpoints

- `POST /auth/register` creates a user account and returns an access token.
- `POST /auth/login` validates credentials and returns an access token.
- `GET /auth/me` returns the authenticated user for a valid bearer token.
- `POST /auth/logout` acknowledges logout. Because JWTs are stateless, clients must discard the token after logout.

## User Schema

The backend creates a `users` table through SQLAlchemy with these fields:

- `id`
- `name`
- `email`
- `password_hash`
- `created_at`
- `updated_at`

Passwords are hashed with bcrypt and plain-text passwords are never stored or returned in API responses.

## Configuration

Set these environment variables for deployment:

```env
DATABASE_URL=sqlite:///backend/data/phishguard.db
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
```

`JWT_SECRET_KEY` must be a long random value in production. Rotate it carefully because existing tokens signed with the old value will stop working.

## Client Session Handling

The frontend stores the access token in `sessionStorage`, attaches it as `Authorization: Bearer <token>` for authenticated requests, verifies dashboard sessions with `/auth/me`, and redirects unauthenticated or expired sessions to `/login`.

## Error Format

Authentication failures use the centralized JSON error shape:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "Invalid email or password.",
    "request_id": "...",
    "details": null
  }
}
```

## Security Notes

- Use HTTPS in production so bearer tokens are never sent over cleartext transport.
- Do not expose `JWT_SECRET_KEY` to the frontend.
- Keep JWT expiration short enough for the deployment risk profile.
- For stricter production logout semantics, add server-side token revocation or refresh-token rotation.

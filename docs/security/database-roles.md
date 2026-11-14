# Least-privilege database roles (Neon)

The app (`DATABASE_URL`) should not use the Neon owner role. If the running site is ever compromised, an attacker should only be able to do what the storefront needs. Migrations and seeding need more rights, so they use a separate admin connection.

| Variable | Used by | Role |
|---|---|---|
| `DATABASE_URL` | The running app (`src/db/index.ts`) | `storefront_app` (restricted) |
| `DATABASE_URL_ADMIN` | `drizzle-kit` (`db:generate`/`db:migrate`) and `db:seed` | The Neon owner role, kept only on developer machines and CI |

`DATABASE_URL_ADMIN` is optional. When it's unset, `drizzle.config.ts` and `src/db/seed.ts` fall back to `DATABASE_URL`, so the current setup keeps working.

## 1. Create the app role

Run this in the Neon SQL editor as the owner role. Use the generated password in the app's `DATABASE_URL`.

```sql
CREATE ROLE storefront_app WITH LOGIN PASSWORD '<generate a long random password>';

GRANT CONNECT ON DATABASE neondb TO storefront_app;   -- use your database name
GRANT USAGE ON SCHEMA public TO storefront_app;

-- Catalog: the storefront only reads it.
GRANT SELECT ON categories, products, product_stock TO storefront_app;

-- Better Auth: sessions, accounts, verification and rate limiting are written at runtime.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON "user", session, account, verification, rate_limit
  TO storefront_app;
```

When orders and cart features arrive, grant only the rights they need. For example, `UPDATE (quantity) ON product_stock` for decrementing stock. Don't grant blanket rights.

## 2. Point the variables at the right roles

```dotenv
# .env.local (developer machine)
DATABASE_URL=postgresql://storefront_app:<password>@<host>/neondb?sslmode=verify-full
DATABASE_URL_ADMIN=postgresql://<owner>:<password>@<host>/neondb?sslmode=verify-full
```

On the hosting platform, set **only** `DATABASE_URL` (the `storefront_app` role). Keep `DATABASE_URL_ADMIN` out of the app's environment.

## 3. Check it

- `npm run db:migrate` still works, because it uses the admin connection.
- The site loads products, because the app role can `SELECT`.
- With the app connection, `DELETE FROM products;` fails with `permission denied`.

## Notes
- Use `sslmode=verify-full`. drizzle-kit's `pg` driver warns that `require` will mean less in its next major version. The app itself connects over HTTPS through the Neon serverless driver.
- Consider a separate Neon branch for development, so `db:seed` can never touch production data.

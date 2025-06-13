# Speed Bites

## GitHub Codespaces
To send requests to the endpoint using Postman in GitHub Codespaces:
- Make the terminal public.
- Use the public URL to send requests via Postman.

## Database Configuration
### Verify the Connection String
The `DATABASE_URL` and `DIRECT_URL` contain special characters in the password (`eB#6s.Gk+gd3#&6`). Special characters in PostgreSQL connection strings need to be URL-encoded:
- `#` → `%23`
- `&` → `%26`

Update the `.env` file to encode the password. See [Prisma’s connection URL docs](https://www.prisma.io/docs/reference/database-reference/connection-urls).

## Install Dev Dependencies
Install `nodemon alternative` as a dev dependency:
```bash
npm install -D ts-node-dev
```

To start in development:
```bash
ts-node-dev src/index.ts
```

## Running the Application
To start in production:
```bash
ts-node src/index.ts
```

## Supabase
For non-Pro Supabase members, the database may pause. Restore it via the [Supabase Dashboard](https://supabase.com/dashboard).

---
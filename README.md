# speed_bites

Verify the Connection String
The DATABASE_URL and DIRECT_URL contain special characters in the password (eB#6s.Gk+gd3#&6). Special characters in PostgreSQL connection strings can cause issues if not properly escaped. According to PostgreSQL documentation (and Prisma’s connection URL docs at https://www.prisma.io/docs/reference/database-reference/connection-urls):

Characters like # and & in the password need to be URL-encoded:
# → %23
& → %26
Update the .env file to encode the password
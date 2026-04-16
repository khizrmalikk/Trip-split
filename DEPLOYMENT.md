# Deployment Guide - TripSplit

## Deploy to Vercel

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import `khizrmalikk/Trip-split` repository
4. Vercel will auto-detect Next.js

### 2. Configure Build Settings

**Framework Preset:** Next.js  
**Root Directory:** `./`  
**Build Command:** `pnpm build`  
**Install Command:** `pnpm install`

### 3. Environment Variables

Add these in Vercel dashboard:

```
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="production"
```

**Note:** For production, you'll want PostgreSQL instead of SQLite.

### 4. PostgreSQL Setup (Recommended for Production)

#### Using Vercel Postgres:

1. In your Vercel project, go to "Storage"
2. Create new "Postgres" database
3. Copy the connection string
4. Update `DATABASE_URL` environment variable
5. Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // changed from sqlite
  url      = env("DATABASE_URL")
}
```

6. Run migrations:
```bash
pnpm prisma migrate dev --name init
pnpm prisma generate
```

7. Redeploy

### 5. Deploy

Click "Deploy" and wait ~2 minutes.

Your app will be live at: `https://trip-split.vercel.app` (or your custom domain)

## Post-Deployment

### Initialize Database

If using PostgreSQL, you'll need to push the schema:

```bash
pnpm prisma db push
```

Or run migrations:

```bash
pnpm prisma migrate deploy
```

### Test the Deployment

1. Visit your deployed URL
2. Create a test trip
3. Add an expense
4. Verify balances calculate correctly

## Custom Domain (Optional)

1. Go to project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Environment-Specific Notes

### Development
- Uses SQLite (`file:./dev.db`)
- Auto-reload on file changes
- `pnpm dev` to run locally

### Production
- Should use PostgreSQL (more reliable)
- Connection pooling recommended
- Set `NODE_ENV=production`

## Troubleshooting

**Build fails with Prisma error:**
- Make sure `DATABASE_URL` is set
- Run `pnpm prisma generate` locally first

**Database connection error:**
- Check `DATABASE_URL` format
- For PostgreSQL, ensure IP is allowed
- Vercel Postgres has connection limits (check your plan)

**API routes return 500:**
- Check Vercel Function Logs
- Ensure Prisma Client is generated
- Verify environment variables

## Monitoring

View logs in Vercel dashboard:
- **Functions**: API route logs
- **Build**: Build-time errors
- **Analytics**: Performance metrics

---

**Ready to deploy!** 🚀

Questions? Check [Vercel Next.js docs](https://vercel.com/docs/frameworks/nextjs)

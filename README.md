# GuestHub (Next.js + PostgreSQL Raw SQL)

پنل مدیریت هتل برای مدیریت کاربران، نقش‌ها، مهمانان، اتاق‌ها و رزرو، با SQL خام و بدون ORM.

## Tech Stack

- Next.js 16 (App Router)
- PostgreSQL 16
- `pg` driver (raw SQL)
- Cookie session auth (HttpOnly)
- Dynamic RBAC (roles + permissions)

## Features

- Login برای کارکنان هتل
- مدیریت کاربر توسط ادمین
- نقش و دسترسی داینامیک (RBAC)
- ثبت مهمان
- ثبت اتاق
- اتصال مهمان به اتاق با رزرو
- نمایش وضعیت اتاق‌ها: `available` / `occupied` / `maintenance`

## Database Setup

1. ساخت دیتابیس و اجرای schema/seed:

```bash
pnpm db:setup
```

2. ساخت یا بروزرسانی ادمین اولیه:

```bash
DATABASE_URL='postgresql://<db_user>@/guesthub?host=/var/run/postgresql' ADMIN_PASSWORD='YourStrongPass123' pnpm db:seed-admin
```

## Environment

یک فایل `.env.local` بسازید:

```env
DATABASE_URL=postgresql://<db_user>@/guesthub?host=/var/run/postgresql
SESSION_TTL_HOURS=24
```

## Run

```bash
pnpm install
pnpm dev
```

سپس:

- `http://localhost:3000/en/login`
- `http://localhost:3000/ar/login`
- با کاربر ادمین وارد شوید.

## Important SQL Files

- `db/001_init.sql`: جدول‌ها، ایندکس‌ها، view وضعیت زنده اتاق
- `db/002_seed_rbac.sql`: seed دسترسی‌ها و نقش‌ها

## Main Tables

- `app_users`
- `app_roles`
- `app_permissions`
- `app_role_permissions`
- `app_user_roles`
- `app_sessions`
- `guests`
- `rooms`
- `reservations`

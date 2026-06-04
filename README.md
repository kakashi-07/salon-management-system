# Salon Management System

A modern React and Express salon operations app for recording customer services, tracking revenue, exporting reports, and managing salon branding.

## Features

- Password protected admin login. Default password: `1234`
- Dashboard cards for daily customers, sales, and payment mode totals
- Daily, monthly, and service distribution charts
- Customer service entry form with validation
- Records table with search, filters, sorting, pagination, view, edit, and delete
- Daily, weekly, monthly, and custom range reports
- PDF and Excel exports
- Salon name, logo, business info, currency, and theme settings
- JSON backup download, restore support, and automatic daily backend backup
- PostgreSQL-ready schema for Render PostgreSQL

## Local Development

Install all dependencies:

```bash
npm run install:all
```

Create backend environment variables:

```bash
cp backend/.env.example backend/.env
```

Update `backend/.env` with your PostgreSQL `DATABASE_URL`, then run:

```bash
npm run dev:backend
npm run dev:frontend
```

Frontend runs at `http://localhost:5173`.
Backend runs at `http://localhost:5000`.

The frontend has a local demo fallback for quick UI testing when the backend is not available.

## Production

This project includes `render.yaml` for Render Blueprint deployment.

Render builds the frontend, starts the Express server, connects the managed PostgreSQL database, and serves the compiled Vite app from `frontend/dist`.

Required environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_PASSWORD`
- `FRONTEND_URL` if using a separate frontend origin

## Database

Primary records table:

```sql
salon_records (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  service TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  sales_amount NUMERIC(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
)
```
# salon-management-system
# salon-management-system

import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import ExcelJS from 'exceljs'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import cron from 'node-cron'
import PDFDocument from 'pdfkit'
import pg from 'pg'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = Number(process.env.PORT || 5000)
const jwtSecret = process.env.JWT_SECRET || 'development-secret-change-me'

const useSqlite = !process.env.DATABASE_URL
const pool = useSqlite
  ? null
  : new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: (process.env.DATABASE_URL?.includes('render.com') || process.env.DATABASE_URL?.includes('supabase.co'))
        ? { rejectUnauthorized: false }
        : false,
    })

let sqliteDb = null

async function getSqliteDb() {
  if (sqliteDb) return sqliteDb
  const { default: sqlite3 } = await import('sqlite3')
  const dbPath = path.join(__dirname, 'salon.db')
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err)
      else {
        sqliteDb = db
        resolve(db)
      }
    })
  })
}

function sqliteQuery(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getSqliteDb()

      let translatedSql = sql
        .replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;?/gi, '')
        .replace(/gen_random_uuid\(\)/gi, "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2,3) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))),2,3) || '-' || lower(hex(randomblob(6))))")
        .replace(/TIMESTAMPTZ/gi, 'DATETIME')
        .replace(/NUMERIC\(\d+,\s*\d+\)/gi, 'REAL')
        .replace(/\bUUID\b/gi, 'TEXT')
        .replace(/SERIAL/gi, 'INTEGER')
        .replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP')
        .replace(/\$(\d+)/g, '?')
        .trim()

      if (!translatedSql) {
        return resolve({ rows: [], rowCount: 0 })
      }

      // Split multi-statement SQL into individual statements and run each
      const isMultiStatement = /;[\s\S]+?\S/.test(translatedSql)
      const isSelect = /^\s*(SELECT|PRAGMA)/i.test(translatedSql)
      const isReturning = /RETURNING/i.test(translatedSql)

      if (isMultiStatement && !isSelect && !isReturning) {
        // Run each statement one at a time
        const statements = translatedSql
          .split(/;+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)

        for (const stmt of statements) {
          await new Promise((res2, rej2) => {
            db.run(stmt, [], function (err) {
              if (err) {
                console.error('SQLite stmt error:', err, 'SQL:', stmt)
                rej2(err)
              } else {
                res2()
              }
            })
          })
        }
        return resolve({ rows: [], rowCount: 0 })
      }

      if (isSelect || isReturning) {
        db.all(translatedSql, params, (err, rows) => {
          if (err) {
            console.error('SQLite query error:', err, 'SQL:', translatedSql)
            reject(err)
          } else {
            resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 })
          }
        })
      } else {
        db.run(translatedSql, params, function (err) {
          if (err) {
            console.error('SQLite query error:', err, 'SQL:', translatedSql)
            reject(err)
          } else {
            resolve({ rows: [], rowCount: this.changes })
          }
        })
      }
    } catch (err) {
      reject(err)
    }
  })
}

const recordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customer_name: z.string().trim().min(1).max(120),
  service: z.string().trim().min(1).max(120),
  home_service: z.string().trim().max(100).optional().default(''),
  payment_mode: z.enum(['UPI', 'Cash', 'Card']),
  sales_amount: z.coerce.number().positive().max(10000000),
  notes: z.string().trim().max(1000).optional().default(''),
})

const settingsSchema = z.object({
  salonName: z.string().trim().min(1).max(150),
  businessInfo: z.string().trim().max(1000).optional().default(''),
  currency: z.string().trim().min(1).max(8).default('₹'),
  theme: z.enum(['light', 'dark']).default('light'),
  logo: z.string().max(500000).optional().default(''),
})

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: process.env.FRONTEND_URL?.split(',') || true, credentials: true }))
app.use(express.json({ limit: '8mb' }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }))

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Authentication required' })

  try {
    req.user = jwt.verify(token, jwtSecret)
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

async function query(sql, params = []) {
  if (useSqlite) {
    return sqliteQuery(sql, params)
  }
  const client = await pool.connect()
  try {
    return await client.query(sql, params)
  } finally {
    client.release()
  }
}

async function initDatabase() {
  await query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS salon_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      customer_name TEXT NOT NULL,
      service TEXT NOT NULL,
      home_service TEXT NOT NULL DEFAULT '',
      payment_mode TEXT NOT NULL CHECK (payment_mode IN ('UPI', 'Cash', 'Card')),
      sales_amount NUMERIC(12, 2) NOT NULL CHECK (sales_amount > 0),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS salon_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      salon_name TEXT NOT NULL DEFAULT 'Luxe Salon Studio',
      business_info TEXT NOT NULL DEFAULT 'Premium hair, skin, and beauty services',
      currency TEXT NOT NULL DEFAULT '₹',
      theme TEXT NOT NULL DEFAULT 'light',
      logo TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (id = 1)
    );
  `)

  if (useSqlite) {
    const tableInfo = await query("PRAGMA table_info(salon_records)")
    const hasColumn = tableInfo.rows.some((row) => row.name === 'home_service')
    if (!hasColumn) {
      await query("ALTER TABLE salon_records ADD COLUMN home_service TEXT NOT NULL DEFAULT ''")
    }
  } else {
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='salon_records' AND column_name='home_service'
    `)
    if (!checkColumn.rowCount) {
      await query("ALTER TABLE salon_records ADD COLUMN home_service TEXT NOT NULL DEFAULT ''")
    }
  }

  await query(`
    INSERT INTO salon_settings (id)
    VALUES (1)
    ON CONFLICT (id) DO NOTHING
  `)

  const admin = await query('SELECT id FROM admins LIMIT 1')
  if (!admin.rowCount) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || '1234', 12)
    await query('INSERT INTO admins (password_hash) VALUES ($1)', [passwordHash])
  }
}

function normalizeRecord(row) {
  return {
    id: row.id,
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10),
    customer_name: row.customer_name,
    service: row.service,
    home_service: row.home_service || 'No',
    payment_mode: row.payment_mode,
    sales_amount: Number(row.sales_amount),
    notes: row.notes || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function normalizeSettings(row) {
  return {
    salonName: row.salon_name,
    businessInfo: row.business_info,
    currency: row.currency,
    theme: row.theme,
    logo: row.logo,
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'salon-management-api' })
})

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const password = z.string().min(1).parse(req.body.password)
  const result = await query('SELECT id, password_hash FROM admins ORDER BY id LIMIT 1')
  const admin = result.rows[0]
  const valid = admin && (await bcrypt.compare(password, admin.password_hash))

  if (!valid) return res.status(401).json({ message: 'Invalid password' })

  const token = jwt.sign({ adminId: admin.id, role: 'admin' }, jwtSecret, { expiresIn: '12h' })
  res.json({ token })
}))

app.get('/api/records', requireAuth, asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM salon_records ORDER BY date DESC, created_at DESC')
  res.json({ records: result.rows.map(normalizeRecord) })
}))

app.post('/api/records', requireAuth, asyncHandler(async (req, res) => {
  const input = recordSchema.parse(req.body)
  const result = await query(
    `INSERT INTO salon_records (date, customer_name, service, home_service, payment_mode, sales_amount, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [input.date, input.customer_name, input.service, input.home_service, input.payment_mode, input.sales_amount, input.notes],
  )
  res.status(201).json({ record: normalizeRecord(result.rows[0]) })
}))

app.put('/api/records/:id', requireAuth, asyncHandler(async (req, res) => {
  const input = recordSchema.parse(req.body)
  const result = await query(
    `UPDATE salon_records
     SET date = $1, customer_name = $2, service = $3, home_service = $4, payment_mode = $5, sales_amount = $6, notes = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [input.date, input.customer_name, input.service, input.home_service, input.payment_mode, input.sales_amount, input.notes, req.params.id],
  )

  if (!result.rowCount) return res.status(404).json({ message: 'Record not found' })
  res.json({ record: normalizeRecord(result.rows[0]) })
}))

app.delete('/api/records/:id', requireAuth, asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM salon_records WHERE id = $1', [req.params.id])
  if (!result.rowCount) return res.status(404).json({ message: 'Record not found' })
  res.status(204).end()
}))

app.get('/api/settings', requireAuth, asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM salon_settings WHERE id = 1')
  res.json({ settings: normalizeSettings(result.rows[0]) })
}))

app.put('/api/settings', requireAuth, asyncHandler(async (req, res) => {
  const input = settingsSchema.parse(req.body)
  const result = await query(
    `UPDATE salon_settings
     SET salon_name = $1, business_info = $2, currency = $3, theme = $4, logo = $5, updated_at = NOW()
     WHERE id = 1
     RETURNING *`,
    [input.salonName, input.businessInfo, input.currency, input.theme, input.logo],
  )
  res.json({ settings: normalizeSettings(result.rows[0]) })
}))

app.post('/api/exports/excel', requireAuth, asyncHandler(async (req, res) => {
  const records = z.array(recordSchema.extend({ id: z.string().optional() })).parse(req.body.records || [])
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Salon Records')
  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Customer Name', key: 'customer_name', width: 24 },
    { header: 'Service', key: 'service', width: 22 },
    { header: 'Home Service', key: 'home_service', width: 16 },
    { header: 'Payment Mode', key: 'payment_mode', width: 16 },
    { header: 'Sales Amount', key: 'sales_amount', width: 16 },
    { header: 'Notes', key: 'notes', width: 36 },
  ]
  sheet.getRow(1).font = { bold: true }
  records.forEach((record) => sheet.addRow(record))

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="salon-records.xlsx"')
  await workbook.xlsx.write(res)
  res.end()
}))

app.post('/api/exports/pdf', requireAuth, asyncHandler(async (req, res) => {
  const records = z.array(recordSchema.extend({ id: z.string().optional() })).parse(req.body.records || [])
  const settings = settingsSchema.parse(req.body.settings)
  const total = records.reduce((sum, record) => sum + Number(record.sales_amount), 0)
  const payments = ['UPI', 'Cash', 'Card'].map((mode) => ({
    mode,
    amount: records.filter((record) => record.payment_mode === mode).reduce((sum, record) => sum + Number(record.sales_amount), 0),
  }))

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="salon-report.pdf"')

  const doc = new PDFDocument({ margin: 48, size: 'A4' })
  doc.pipe(res)

  const currencySymbol = settings.currency === '₹' ? 'Rs. ' : settings.currency

  doc.fontSize(22).font('Helvetica-Bold').text(settings.salonName)
  doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(settings.businessInfo || 'Salon sales report')
  doc.moveDown()
  doc.fillColor('#0f172a').fontSize(12).text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`)
  doc.text(`Total Revenue: ${currencySymbol}${total.toLocaleString('en-IN')}`)
  doc.text(`Number of Customers: ${records.length}`)
  doc.moveDown()

  doc.font('Helvetica-Bold').text('Payment Breakdown')
  payments.forEach((item) => doc.font('Helvetica').text(`${item.mode}: ${currencySymbol}${item.amount.toLocaleString('en-IN')}`))
  doc.moveDown()

  doc.font('Helvetica-Bold').text('Customer Records')
  doc.moveDown(0.5)
  records.forEach((record, index) => {
    if (doc.y > 730) doc.addPage()
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#0f172a')
      .text(`${index + 1}. ${record.date} - ${record.customer_name} - ${record.service}${record.home_service ? ` (Home: ${record.home_service})` : ''}`)
    doc
      .font('Helvetica')
      .fillColor('#475569')
      .text(`${record.payment_mode} | ${currencySymbol}${Number(record.sales_amount).toLocaleString('en-IN')} | ${record.notes || '-'}`)
      .moveDown(0.4)
  })

  doc.end()
}))

async function makeBackup() {
  const [records, settings] = await Promise.all([
    query('SELECT * FROM salon_records ORDER BY date DESC, created_at DESC'),
    query('SELECT * FROM salon_settings WHERE id = 1'),
  ])
  const payload = {
    exported_at: new Date().toISOString(),
    records: records.rows.map(normalizeRecord),
    settings: normalizeSettings(settings.rows[0]),
  }
  const backupsDir = path.join(__dirname, 'backups')
  await fs.mkdir(backupsDir, { recursive: true })
  const file = path.join(backupsDir, `salon-backup-${new Date().toISOString().slice(0, 10)}.json`)
  await fs.writeFile(file, JSON.stringify(payload, null, 2))
  return { file, payload }
}

app.post('/api/backup', requireAuth, asyncHandler(async (req, res) => {
  const { file } = await makeBackup()
  res.download(file)
}))

app.post('/api/restore', requireAuth, asyncHandler(async (req, res) => {
  const payload = z.object({ records: z.array(recordSchema), settings: settingsSchema.optional() }).parse(req.body)
  await query('DELETE FROM salon_records')
  for (const record of payload.records) {
    await query(
      `INSERT INTO salon_records (date, customer_name, service, home_service, payment_mode, sales_amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [record.date, record.customer_name, record.service, record.home_service || 'No', record.payment_mode, record.sales_amount, record.notes],
    )
  }
  if (payload.settings) {
    await query(
      `UPDATE salon_settings
       SET salon_name = $1, business_info = $2, currency = $3, theme = $4, logo = $5, updated_at = NOW()
       WHERE id = 1`,
      [payload.settings.salonName, payload.settings.businessInfo, payload.settings.currency, payload.settings.theme, payload.settings.logo],
    )
  }
  res.json({ restored: payload.records.length })
}))

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist')
app.use(express.static(frontendDist))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(frontendDist, 'index.html'))
})

app.use((error, req, res, next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: 'Invalid input', issues: error.issues })
  }
  console.error(error)
  res.status(500).json({ message: 'Server error' })
})

initDatabase()
  .then(() => {
    cron.schedule('0 2 * * *', () => makeBackup().catch((error) => console.error('Daily backup failed', error)))
    app.listen(port, () => console.log(`Salon Management API running on port ${port}`))
  })
  .catch((error) => {
    console.error('Database initialization failed', error)
    process.exit(1)
  })

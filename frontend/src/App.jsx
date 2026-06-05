import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  DatabaseBackup,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  Plus,
  RefreshCcw,
  Save,
  Scissors,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Users,
  Wallet,
  X,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')
const today = () => new Date().toISOString().slice(0, 10)

const seedRecords = [
  {
    id: 'demo-1',
    date: today(),
    customer_name: 'Priya',
    service: 'Hair Spa',
    home_service: '',
    payment_mode: 'UPI',
    sales_amount: 1500,
    notes: 'Membership customer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    date: today(),
    customer_name: 'Rahul',
    service: 'Hair Cut',
    home_service: '',
    payment_mode: 'Cash',
    sales_amount: 300,
    notes: 'Beard trim included',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    customer_name: 'Rakesh',
    service: 'Facial',
    home_service: '',
    payment_mode: 'Card',
    sales_amount: 900,
    notes: 'Special discount given',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const defaultSettings = {
  salonName: 'Luxe Salon Studio',
  businessInfo: 'Premium hair, skin, and beauty services',
  currency: '₹',
  theme: 'light',
  logo: '',
}

function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

async function request(path, options = {}) {
  const token = localStorage.getItem('salon_token')
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.message || 'Request failed')
  }
  return response
}

function currency(value, symbol = '₹') {
  return `${symbol}${Number(value || 0).toLocaleString('en-IN')}`
}

function Card({ children, className = '' }) {
  return <div className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-slate-950 text-white hover:bg-slate-800',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  }

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function Field({ label, children, required }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${className}`}
      {...props}
    />
  )
}

function Select({ className = '', ...props }) {
  return (
    <select
      className={`h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${className}`}
      {...props}
    />
  )
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`min-h-24 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${className}`}
      {...props}
    />
  )
}

function Toast({ toast, onClose }) {
  if (!toast) return null
  return (
    <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-xl">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
        <div className="flex-1">
          <p className="font-semibold text-slate-950">{toast.title}</p>
          <p className="mt-1 text-slate-500">{toast.message}</p>
        </div>
        <button onClick={onClose} aria-label="Close notification">
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </div>
  )
}

function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      const data = await response.json()
      localStorage.setItem('salon_token', data.token)
      onLogin()
    } catch {
      if (password === '1234') {
        localStorage.setItem('salon_token', 'demo-token')
        onLogin()
      } else {
        setError('Invalid password. Default password is 1234.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#f6d7c6_0,transparent_34%),radial-gradient(circle_at_bottom_right,#bfe7e2_0,transparent_32%)] opacity-30" />
      <Card className="relative grid w-full max-w-5xl overflow-hidden border-white/10 bg-white/95 shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="p-8 sm:p-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Scissors className="h-6 w-6" />
          </div>
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Salon Management System</h1>
          <p className="mt-3 max-w-xl text-slate-600">
            Record daily services, track payments, export reports, and keep salon operations beautifully organized.
          </p>

          <form onSubmit={submit} className="mt-10 grid max-w-md gap-4">
            <Field label="Admin Password" required>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Default: 1234"
                  className="pl-10"
                  required
                />
              </div>
            </Field>
            {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <Button disabled={loading}>
              <ShieldCheck className="h-4 w-4" />
              {loading ? 'Signing in...' : 'Login securely'}
            </Button>
          </form>
        </section>
        <section className="hidden bg-slate-100 p-10 lg:block">
          <div className="grid h-full content-between rounded-lg bg-white p-8 shadow-sm">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Owner Console</p>
              <div className="mt-8 grid gap-4">
                {[
                  ['Daily revenue', '₹2,700', 'Live sales view'],
                  ['Customers today', '14', 'Service history'],
                  ['UPI payments', '₹1,500', 'Payment split'],
                ].map(([label, value, sub]) => (
                  <div key={label} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
                    <p className="mt-1 text-xs text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-500">Secure API, PostgreSQL schema, protected routes, exports, and backups are included.</p>
          </div>
        </section>
      </Card>
    </main>
  )
}

function MiniChart({ data, type = 'bar', currencySymbol }) {
  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1)
  if (type === 'line') {
    const points = data
      .map((item, index) => {
        const x = data.length === 1 ? 0 : (index / (data.length - 1)) * 100
        const y = 100 - (Number(item.value) / max) * 82 - 8
        return `${x},${y}`
      })
      .join(' ')
    return (
      <div className="h-48">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-36 w-full overflow-visible">
          <polyline points={points} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="grid grid-cols-4 gap-2 text-xs text-slate-400">
          {data.slice(-4).map((item) => (
            <span key={item.label} className="truncate">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-48 items-end gap-3">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end rounded-md bg-slate-100">
            <div
              className="w-full rounded-md bg-slate-950 transition-all"
              style={{ height: `${Math.max((Number(item.value) / max) * 100, 5)}%` }}
              title={`${item.label}: ${currency(item.value, currencySymbol)}`}
            />
          </div>
          <span className="max-w-full truncate text-xs text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function Donut({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1
  let offset = 25
  const colors = ['#0f172a', '#14b8a6', '#f97316', '#8b5cf6', '#e11d48']

  return (
    <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
      <svg viewBox="0 0 42 42" className="mx-auto h-40 w-40">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="6" />
        {data.map((item, index) => {
          const length = (item.value / total) * 100
          const segment = (
            <circle
              key={item.label}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={colors[index % colors.length]}
              strokeWidth="6"
              strokeDasharray={`${length} ${100 - length}`}
              strokeDashoffset={offset}
            />
          )
          offset -= length
          return segment
        })}
      </svg>
      <div className="grid gap-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
              {item.label}
            </span>
            <span className="font-semibold text-slate-950">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Dashboard({ records, settings }) {
  const todayRecords = records.filter((record) => record.date === today())
  const totals = {
    customers: todayRecords.length,
    sales: todayRecords.reduce((sum, record) => sum + Number(record.sales_amount), 0),
    Cash: todayRecords.filter((record) => record.payment_mode === 'Cash').reduce((sum, record) => sum + Number(record.sales_amount), 0),
    UPI: todayRecords.filter((record) => record.payment_mode === 'UPI').reduce((sum, record) => sum + Number(record.sales_amount), 0),
    Card: todayRecords.filter((record) => record.payment_mode === 'Card').reduce((sum, record) => sum + Number(record.sales_amount), 0),
  }

  const dailyRevenue = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    return {
      label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      value: records.filter((record) => record.date === key).reduce((sum, record) => sum + Number(record.sales_amount), 0),
    }
  })

  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - index))
    const key = date.toISOString().slice(0, 7)
    return {
      label: date.toLocaleDateString('en-IN', { month: 'short' }),
      value: records.filter((record) => record.date.startsWith(key)).reduce((sum, record) => sum + Number(record.sales_amount), 0),
    }
  })

  const serviceDistribution = Object.entries(
    records.reduce((acc, record) => {
      acc[record.service] = (acc[record.service] || 0) + 1
      return acc
    }, {}),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const cards = [
    ['Total Customers Today', totals.customers, Users, 'Customers served today'],
    ['Total Sales Today', currency(totals.sales, settings.currency), IndianRupee, 'Revenue booked today'],
    ['Cash Payments', currency(totals.Cash, settings.currency), Wallet, 'Cash collected'],
    ['UPI Payments', currency(totals.UPI, settings.currency), Sparkles, 'Digital payments'],
    ['Card Payments', currency(totals.Card, settings.currency), CreditCard, 'Card settlements'],
  ]

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, Icon, sub]) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Live</span>
            </div>
            <p className="mt-5 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Daily Revenue</h2>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <MiniChart data={dailyRevenue} currencySymbol={settings.currency} />
        </Card>
        <Card className="p-5 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Monthly Revenue</h2>
            <CalendarDays className="h-5 w-5 text-slate-400" />
          </div>
          <MiniChart data={monthlyRevenue} type="line" currencySymbol={settings.currency} />
        </Card>
        <Card className="p-5 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Service Distribution</h2>
            <Scissors className="h-5 w-5 text-slate-400" />
          </div>
          <Donut data={serviceDistribution.length ? serviceDistribution : [{ label: 'No services yet', value: 1 }]} />
        </Card>
      </div>
    </div>
  )
}

function EntryForm({ onSave, editingRecord, onCancel, notify }) {
  const blank = { date: today(), customer_name: '', service: '', home_service: '', payment_mode: 'UPI', sales_amount: '', notes: '' }
  const [form, setForm] = useState(blank)

  useEffect(() => {
    setForm(editingRecord || blank)
  }, [editingRecord])

  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value }
      if (field === 'home_service' && value !== '') {
        next.sales_amount = value
      }
      return next
    })
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.customer_name.trim() || !form.service.trim() || Number(form.sales_amount) <= 0) {
      notify('Validation needed', 'Customer, service, and a positive amount are required.')
      return
    }
    await onSave({ ...form, sales_amount: Number(form.sales_amount) })
    setForm(blank)
  }

  return (
    <Card className="p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{editingRecord ? 'Edit Service Entry' : 'Customer Service Entry'}</h2>
          <p className="text-sm text-slate-500">Capture each customer visit in under a minute.</p>
        </div>
        {editingRecord && (
          <Button variant="secondary" onClick={onCancel}>
            <X className="h-4 w-4" />
            Cancel edit
          </Button>
        )}
      </div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Date" required>
          <Input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} required />
        </Field>
        <Field label="Customer Name" required>
          <Input value={form.customer_name} onChange={(event) => update('customer_name', event.target.value)} placeholder="Rahul" required />
        </Field>
        <Field label="Service" required>
          <Input value={form.service} onChange={(event) => update('service', event.target.value)} placeholder="Hair Cut" required />
        </Field>
        <Field label="Home Service">
          <Input type="number" min="0" value={form.home_service || ''} onChange={(event) => update('home_service', event.target.value)} placeholder="e.g. 500" />
        </Field>
        <Field label="Mode of Payment" required>
          <Select value={form.payment_mode} onChange={(event) => update('payment_mode', event.target.value)} required>
            <option>UPI</option>
            <option>Cash</option>
            <option>Card</option>
          </Select>
        </Field>
        <Field label="Sales Amount" required>
          <Input
            type="number"
            min="1"
            value={form.sales_amount}
            onChange={(event) => update('sales_amount', event.target.value)}
            placeholder="500"
            required
          />
        </Field>
        <Field label="Notes">
          <Textarea value={form.notes || ''} onChange={(event) => update('notes', event.target.value)} placeholder="Special discount given" />
        </Field>
        <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-3">
          <Button>
            <Save className="h-4 w-4" />
            Save Entry
          </Button>
          <Button type="button" variant="secondary" onClick={() => setForm(blank)}>
            <RefreshCcw className="h-4 w-4" />
            Reset Form
          </Button>
        </div>
      </form>
    </Card>
  )
}

function RecordsTable({ records, settings, filters, setFilters, onEdit, onDelete, onView }) {
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' })
  const [page, setPage] = useState(1)
  const pageSize = 8

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase()
    return records
      .filter((record) => !filters.from || record.date >= filters.from)
      .filter((record) => !filters.to || record.date <= filters.to)
      .filter((record) => !filters.payment || record.payment_mode === filters.payment)
      .filter((record) => !filters.customer || record.customer_name.toLowerCase().includes(filters.customer.toLowerCase()))
      .filter((record) => !filters.service || record.service.toLowerCase().includes(filters.service.toLowerCase()))
      .filter((record) => !filters.homeService || String(record.home_service || '').toLowerCase().includes(filters.homeService.toLowerCase()))
      .filter((record) => !filters.min || Number(record.sales_amount) >= Number(filters.min))
      .filter((record) => !filters.max || Number(record.sales_amount) <= Number(filters.max))
      .filter(
        (record) =>
          !search ||
          [record.customer_name, record.service, record.home_service, record.payment_mode, record.notes].some((value) =>
            String(value || '').toLowerCase().includes(search),
          ),
      )
      .sort((a, b) => {
        const left = a[sort.key]
        const right = b[sort.key]
        const result = sort.key === 'sales_amount' ? Number(left) - Number(right) : String(left).localeCompare(String(right))
        return sort.direction === 'asc' ? result : -result
      })
  }, [records, filters, sort])

  const pages = Math.max(Math.ceil(filtered.length / pageSize), 1)
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [filters])

  function toggleSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const headers = [
    ['date', 'Date'],
    ['customer_name', 'Customer Name'],
    ['service', 'Service'],
    ['home_service', 'Home Service'],
    ['payment_mode', 'Payment Mode'],
    ['sales_amount', 'Sales Amount'],
  ]

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Records Management</h2>
            <p className="text-sm text-slate-500">Search, filter, sort, and manage every service record.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="Instant search"
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4 xl:grid-cols-9">
          <Input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
          <Input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
          <Input placeholder="Customer" value={filters.customer} onChange={(event) => setFilters({ ...filters, customer: event.target.value })} />
          <Input placeholder="Service" value={filters.service} onChange={(event) => setFilters({ ...filters, service: event.target.value })} />
          <Input placeholder="Home Service" value={filters.homeService} onChange={(event) => setFilters({ ...filters, homeService: event.target.value })} />
          <Select value={filters.payment} onChange={(event) => setFilters({ ...filters, payment: event.target.value })}>
            <option value="">All payments</option>
            <option>UPI</option>
            <option>Cash</option>
            <option>Card</option>
          </Select>
          <Input type="number" placeholder="Min amount" value={filters.min} onChange={(event) => setFilters({ ...filters, min: event.target.value })} />
          <Input type="number" placeholder="Max amount" value={filters.max} onChange={(event) => setFilters({ ...filters, max: event.target.value })} />
          <Button
            variant="secondary"
            onClick={() => setFilters({ search: '', from: '', to: '', customer: '', service: '', homeService: '', payment: '', min: '', max: '' })}
          >
            <RefreshCcw className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {headers.map(([key, label]) => (
                <th key={key} className="px-5 py-3">
                  <button className="font-bold" onClick={() => toggleSort(key)}>
                    {label}
                  </button>
                </th>
              ))}
              <th className="px-5 py-3">Notes</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 text-slate-700">{record.date}</td>
                <td className="px-5 py-4 font-semibold text-slate-950">{record.customer_name}</td>
                <td className="px-5 py-4 text-slate-700">{record.service}</td>
                <td className="px-5 py-4 text-slate-700">{record.home_service || '-'}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{record.payment_mode}</span>
                </td>
                <td className="px-5 py-4 font-bold text-slate-950">{currency(record.sales_amount, settings.currency)}</td>
                <td className="max-w-[220px] truncate px-5 py-4 text-slate-500">{record.notes || '-'}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" className="px-2" onClick={() => onView(record)} aria-label="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="px-2" onClick={() => onEdit(record)} aria-label="Edit">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="danger" className="px-2" onClick={() => onDelete(record.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-5 py-12 text-center text-slate-500" colSpan="8">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
        <span>
          Showing {rows.length} of {filtered.length} records
        </span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
            Previous
          </Button>
          <span>
            Page {page} / {pages}
          </span>
          <Button variant="secondary" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}

function Reports({ records, settings, onExportPdf, onExportExcel }) {
  const [range, setRange] = useState('daily')
  const [custom, setCustom] = useState({ from: today(), to: today() })

  const reportRecords = useMemo(() => {
    const now = new Date()
    let from = today()
    let to = today()

    if (range === 'weekly') {
      const start = new Date(now)
      start.setDate(now.getDate() - 6)
      from = start.toISOString().slice(0, 10)
    } else if (range === 'monthly') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    } else if (range === 'custom') {
      from = custom.from
      to = custom.to
    }

    return records.filter((record) => record.date >= from && record.date <= to)
  }, [records, range, custom])

  const total = reportRecords.reduce((sum, record) => sum + Number(record.sales_amount), 0)
  const services = reportRecords.reduce((acc, record) => {
    acc[record.service] = (acc[record.service] || 0) + 1
    return acc
  }, {})
  const mostPopular = Object.entries(services).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
  const payments = ['UPI', 'Cash', 'Card'].map((mode) => ({
    label: mode,
    value: reportRecords.filter((record) => record.payment_mode === mode).reduce((sum, record) => sum + Number(record.sales_amount), 0),
  }))

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Reports</h2>
            <p className="text-sm text-slate-500">Generate daily, weekly, monthly, or custom sales reports.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="daily">Daily Sales</option>
              <option value="weekly">Weekly Sales</option>
              <option value="monthly">Monthly Sales</option>
              <option value="custom">Custom Date Range</option>
            </Select>
            {range === 'custom' && (
              <>
                <Input type="date" value={custom.from} onChange={(event) => setCustom({ ...custom, from: event.target.value })} />
                <Input type="date" value={custom.to} onChange={(event) => setCustom({ ...custom, to: event.target.value })} />
              </>
            )}
            <Button variant="secondary" onClick={() => onExportPdf(reportRecords, range)}>
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="secondary" onClick={() => onExportExcel(reportRecords)}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Total Revenue', currency(total, settings.currency)],
          ['Number of Customers', reportRecords.length],
          ['Most Popular Service', mostPopular],
          ['Average Ticket', currency(reportRecords.length ? total / reportRecords.length : 0, settings.currency)],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-bold text-slate-950">Payment Method Breakdown</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {payments.map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-xl font-bold text-slate-950">{currency(item.value, settings.currency)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SettingsPanel({ settings, setSettings, notify }) {
  const [draft, setDraft] = useState(settings)

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  function uploadLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setDraft((current) => ({ ...current, logo: reader.result }))
    reader.readAsDataURL(file)
  }

  function save() {
    setSettings(draft)
    notify('Settings saved', 'Salon branding and preferences were updated.')
  }

  return (
    <Card className="p-5">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-950">Settings</h2>
        <p className="text-sm text-slate-500">Manage salon branding, business information, currency, and theme preference.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
            {draft.logo ? <img src={draft.logo} alt="Salon logo" className="h-full w-full object-cover" /> : <Scissors className="h-9 w-9 text-slate-400" />}
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            <Upload className="h-4 w-4" />
            Upload Logo
            <input className="hidden" type="file" accept="image/*" onChange={uploadLogo} />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Salon Name" required>
            <Input value={draft.salonName} onChange={(event) => setDraft({ ...draft, salonName: event.target.value })} />
          </Field>
          <Field label="Currency Symbol" required>
            <Input value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value })} />
          </Field>
          <Field label="Theme Preference">
            <Select value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
          <Field label="Business Information">
            <Textarea value={draft.businessInfo} onChange={(event) => setDraft({ ...draft, businessInfo: event.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Button onClick={save}>
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function BackupPanel({ records, settings, setRecords, notify }) {
  async function backup() {
    try {
      const response = await request('/backup', { method: 'POST' })
      const blob = await response.blob()
      downloadBlob(blob, `salon-backup-${today()}.json`)
    } catch {
      const blob = new Blob([JSON.stringify({ records, settings, exported_at: new Date().toISOString() }, null, 2)], {
        type: 'application/json',
      })
      downloadBlob(blob, `salon-backup-${today()}.json`)
    }
    notify('Backup downloaded', 'A secure backup file has been generated.')
  }

  function restore(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result)
        if (Array.isArray(payload.records)) {
          setRecords(payload.records)
          notify('Backup restored', 'Records were restored from the selected backup file.')
        }
      } catch {
        notify('Restore failed', 'The selected file is not a valid salon backup.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Backup System</h2>
          <p className="text-sm text-slate-500">Download and restore backups. The backend also schedules automatic daily backups.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={backup}>
            <DatabaseBackup className="h-4 w-4" />
            One-click Backup
          </Button>
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            Restore Backup
            <input className="hidden" type="file" accept="application/json" onChange={restore} />
          </label>
        </div>
      </div>
    </Card>
  )
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportCsv(records, filename) {
  const headers = ['Date', 'Customer Name', 'Service', 'Home Service', 'Payment Mode', 'Sales Amount', 'Notes']
  const lines = records.map((record) =>
    [record.date, record.customer_name, record.service, record.home_service || 'No', record.payment_mode, record.sales_amount, record.notes]
      .map((value) => `"${String(value || '').replaceAll('"', '""')}"`)
      .join(','),
  )
  downloadBlob(new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv' }), filename)
}

function generateClientPdf(records, settings, range) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 42
  let y = margin

  const total = records.reduce((sum, record) => sum + Number(record.sales_amount), 0)
  const paymentTotals = ['UPI', 'Cash', 'Card'].map((mode) => ({
    mode,
    amount: records.filter((record) => record.payment_mode === mode).reduce((sum, record) => sum + Number(record.sales_amount), 0),
  }))
  const services = records.reduce((acc, record) => {
    acc[record.service] = (acc[record.service] || 0) + 1
    return acc
  }, {})
  const mostPopular = Object.entries(services).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

  function ensureSpace(height = 70) {
    if (y + height < pageHeight - margin) return
    doc.addPage()
    y = margin
  }

  function text(value, x, options = {}) {
    const { size = 10, weight = 'normal', color = [71, 85, 105], maxWidth = pageWidth - margin * 2, lineGap = 4 } = options
    doc.setFont('helvetica', weight)
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(String(value || ''), maxWidth)
    doc.text(lines, x, y)
    y += lines.length * (size + lineGap)
  }

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, 118, 'F')
  if (settings.logo?.startsWith('data:image')) {
    try {
      doc.addImage(settings.logo, 'PNG', margin, 28, 48, 48)
    } catch {
      doc.setDrawColor(255, 255, 255)
      doc.roundedRect(margin, 28, 48, 48, 6, 6, 'S')
    }
  } else {
    doc.setDrawColor(255, 255, 255)
    doc.roundedRect(margin, 28, 48, 48, 6, 6, 'S')
  }

  y = 43
  text(settings.salonName, margin + 66, { size: 22, weight: 'bold', color: [255, 255, 255], maxWidth: 360 })
  text(settings.businessInfo || 'Salon sales report', margin + 66, { size: 10, color: [203, 213, 225], maxWidth: 360 })

  y = 150
  text(`${range.toUpperCase()} SALES REPORT`, margin, { size: 11, weight: 'bold', color: [100, 116, 139] })
  text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, margin, { size: 10 })

  const summary = [
    ['Total Revenue', currency(total, settings.currency)],
    ['Customers', records.length],
    ['Most Popular Service', mostPopular],
    ['Average Ticket', currency(records.length ? total / records.length : 0, settings.currency)],
  ]

  y += 12
  const cardWidth = (pageWidth - margin * 2 - 24) / 2
  summary.forEach(([label, value], index) => {
    const x = margin + (index % 2) * (cardWidth + 24)
    if (index > 0 && index % 2 === 0) y += 82
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, y, cardWidth, 62, 6, 6, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(String(label), x + 14, y + 21)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(15, 23, 42)
    doc.text(String(value), x + 14, y + 45)
  })

  y += 96
  text('Payment Method Breakdown', margin, { size: 13, weight: 'bold', color: [15, 23, 42] })
  paymentTotals.forEach((item) => {
    text(`${item.mode}: ${currency(item.amount, settings.currency)}`, margin, { size: 10 })
  })

  y += 18
  text('Customer Records', margin, { size: 13, weight: 'bold', color: [15, 23, 42] })
  y += 4

  const columns = [
    ['Date', 65],
    ['Customer', 95],
    ['Service', 95],
    ['Home', 50],
    ['Pay', 45],
    ['Amount', 65],
    ['Notes', 96],
  ]

  function tableHeader() {
    ensureSpace(52)
    let x = margin
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, y, pageWidth - margin * 2, 24, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105)
    columns.forEach(([label, width]) => {
      doc.text(label, x + 4, y + 16)
      x += width
    })
    y += 30
  }

  tableHeader()
  records.forEach((record) => {
    ensureSpace(36)
    let x = margin
    const values = [
      record.date,
      record.customer_name,
      record.service,
      record.home_service || 'No',
      record.payment_mode,
      currency(record.sales_amount, settings.currency),
      record.notes || '-',
    ]
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    values.forEach((value, index) => {
      const width = columns[index][1]
      const clipped = doc.splitTextToSize(String(value), width - 8).slice(0, 2)
      doc.text(clipped, x + 4, y)
      x += width
    })
    y += 28
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, y - 12, pageWidth - margin, y - 12)
  })

  doc.save(`salon-report-${range}-${today()}.pdf`)
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem('salon_token')))
  const [active, setActive] = useState('dashboard')
  const [records, setRecords] = useState(() => readStore('salon_records', seedRecords))
  const [settings, setSettingsState] = useState(() => readStore('salon_settings', defaultSettings))
  const [editingRecord, setEditingRecord] = useState(null)
  const [viewRecord, setViewRecord] = useState(null)
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filters, setFilters] = useState({ search: '', from: '', to: '', customer: '', service: '', homeService: '', payment: '', min: '', max: '' })

  useEffect(() => {
    if (!authenticated) return
    request('/records')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.records)) setRecords(data.records)
      })
      .catch(() => {})

    request('/settings')
      .then((response) => response.json())
      .then((data) => {
        if (data.settings) setSettingsState({ ...defaultSettings, ...data.settings })
      })
      .catch(() => {})
  }, [authenticated])

  useEffect(() => writeStore('salon_records', records), [records])
  useEffect(() => writeStore('salon_settings', settings), [settings])
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', settings.theme === 'dark')
  }, [settings.theme])

  function notify(title, message) {
    setToast({ title, message })
    window.setTimeout(() => setToast(null), 3500)
  }

  async function saveRecord(record) {
    if (editingRecord) {
      const updated = { ...record, id: editingRecord.id, updated_at: new Date().toISOString() }
      setRecords((current) => current.map((item) => (item.id === editingRecord.id ? updated : item)))
      setEditingRecord(null)
      request(`/records/${editingRecord.id}`, { method: 'PUT', body: JSON.stringify(record) }).catch(() => {})
      notify('Entry updated', 'The customer service record was updated.')
      return
    }

    const optimistic = {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setRecords((current) => [optimistic, ...current])
    request('/records', { method: 'POST', body: JSON.stringify(record) })
      .then((response) => response.json())
      .then((data) => {
        if (data.record) setRecords((current) => current.map((item) => (item.id === optimistic.id ? data.record : item)))
      })
      .catch(() => {})
    notify('Entry saved', 'Customer service and sales details were recorded.')
  }

  function deleteRecord(id) {
    if (!confirm('Delete this record?')) return
    setRecords((current) => current.filter((record) => record.id !== id))
    request(`/records/${id}`, { method: 'DELETE' }).catch(() => {})
    notify('Record deleted', 'The selected record was removed.')
  }

  function saveSettings(next) {
    setSettingsState(next)
    request('/settings', { method: 'PUT', body: JSON.stringify(next) }).catch(() => {})
  }

  async function exportPdf(reportRecords = records, range = 'all') {
    try {
      const response = await request('/exports/pdf', {
        method: 'POST',
        body: JSON.stringify({ records: reportRecords, settings, range }),
      })
      downloadBlob(await response.blob(), `salon-report-${range}-${today()}.pdf`)
    } catch {
      generateClientPdf(reportRecords, settings, range)
      notify('PDF downloaded', 'A formatted PDF report was generated in the browser.')
    }
  }

  async function exportExcel(exportRecords = records) {
    try {
      const response = await request('/exports/excel', {
        method: 'POST',
        body: JSON.stringify({ records: exportRecords }),
      })
      downloadBlob(await response.blob(), `salon-records-${today()}.xlsx`)
    } catch {
      exportCsv(exportRecords, `salon-records-${today()}.csv`)
    }
  }

  function logout() {
    localStorage.removeItem('salon_token')
    setAuthenticated(false)
  }

  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />

  const nav = [
    ['dashboard', 'Dashboard', BarChart3],
    ['entry', 'Entry', Plus],
    ['records', 'Records', Users],
    ['reports', 'Reports', FileText],
    ['backup', 'Backup', DatabaseBackup],
    ['settings', 'Settings', Settings],
  ]

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Toast toast={toast} onClose={() => setToast(null)} />
      {sidebarOpen && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-slate-950 text-white">
            {settings.logo ? <img src={settings.logo} alt="Salon logo" className="h-full w-full object-cover" /> : <Scissors className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-950">{settings.salonName}</p>
            <p className="truncate text-xs text-slate-500">{settings.businessInfo}</p>
          </div>
        </div>
        <nav className="grid gap-1 p-4">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => {
                setActive(id)
                setSidebarOpen(false)
              }}
              className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition ${
                active === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-200 p-4">
          <Button variant="secondary" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="px-2 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">{nav.find(([id]) => id === active)?.[1]}</h1>
              <p className="hidden text-sm text-slate-500 sm:block">Fast sales tracking for professional salon operations.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => saveSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' })}>
              {settings.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">Theme</span>
            </Button>
            <Button onClick={() => setActive('entry')}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Entry</span>
            </Button>
          </div>
        </header>

        <main className="grid gap-6 p-4 sm:p-6">
          {active === 'dashboard' && <Dashboard records={records} settings={settings} />}
          {active === 'entry' && (
            <EntryForm
              onSave={saveRecord}
              editingRecord={editingRecord}
              onCancel={() => setEditingRecord(null)}
              notify={notify}
            />
          )}
          {active === 'records' && (
            <RecordsTable
              records={records}
              settings={settings}
              filters={filters}
              setFilters={setFilters}
              onEdit={(record) => {
                setEditingRecord(record)
                setActive('entry')
              }}
              onView={setViewRecord}
              onDelete={deleteRecord}
            />
          )}
          {active === 'reports' && <Reports records={records} settings={settings} onExportPdf={exportPdf} onExportExcel={exportExcel} />}
          {active === 'backup' && <BackupPanel records={records} settings={settings} setRecords={setRecords} notify={notify} />}
          {active === 'settings' && <SettingsPanel settings={settings} setSettings={saveSettings} notify={notify} />}
        </main>
      </div>

      {viewRecord && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <Card className="w-full max-w-lg p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">Record Details</h2>
              <button onClick={() => setViewRecord(null)} aria-label="Close details">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              {[
                ['Date', viewRecord.date],
                ['Customer Name', viewRecord.customer_name],
                ['Service', viewRecord.service],
                ['Home Service', viewRecord.home_service || 'No'],
                ['Payment Mode', viewRecord.payment_mode],
                ['Sales Amount', currency(viewRecord.sales_amount, settings.currency)],
                ['Notes', viewRecord.notes || '-'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 rounded-md bg-slate-50 p-3">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-right font-semibold text-slate-950">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { addEquipment } from '../services/equipmentService'
import type { AddEquipmentPayload, OwnerEquipment } from '../types/equipment'

interface Props {
  onSuccess: (equipment: OwnerEquipment) => void
  onCancel: () => void
}

const CATEGORIES = ['Tractor', 'Harvester', 'Plough', 'Irrigation', 'Sprayer', 'Seeder', 'Other']

const DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara',
  'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga',
  'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe',
  'Nyamasheke', 'Nyanza', 'Nyarugenge', 'Nyaruguru', 'Rubavu', 'Ruhango',
  'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana',
]

type FormState = AddEquipmentPayload

const empty: FormState = {
  name: '', description: '', category: '', dailyPrice: '',
  imageUrl: '', district: '', sector: '',
}

export default function AddEquipmentForm({ onSuccess, onCancel }: Props) {
  const [form, setForm]       = useState<FormState>(empty)
  const [errors, setErrors]   = useState<Partial<FormState>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
    setApiError(null)
  }

  function validate(): boolean {
    const e: Partial<FormState> = {}
    if (!form.name.trim())        e.name        = 'Tool name is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.category)           e.category    = 'Category is required'
    if (!form.district)           e.district    = 'District is required'
    if (!form.sector.trim())      e.sector      = 'Sector is required'
    const price = parseFloat(form.dailyPrice)
    if (!form.dailyPrice || isNaN(price) || price <= 0)
      e.dailyPrice = 'Enter a valid daily price greater than 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError(null)
    try {
      const created = await addEquipment(form)
      onSuccess(created)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Tool Name" error={errors.name}>
        <input
          className={input(errors.name)}
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. John Deere Tractor 5075E"
          disabled={loading}
        />
      </Field>

      <Field label="Description" error={errors.description}>
        <textarea
          className={input(errors.description)}
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Describe the equipment, its condition, and usage..."
          disabled={loading}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Category" error={errors.category}>
          <select
            className={input(errors.category)}
            value={form.category}
            onChange={e => set('category', e.target.value)}
            disabled={loading}
          >
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Daily Rental Price (RWF)" error={errors.dailyPrice}>
          <input
            type="number"
            min="1"
            step="any"
            className={input(errors.dailyPrice)}
            value={form.dailyPrice}
            onChange={e => set('dailyPrice', e.target.value)}
            placeholder="e.g. 25000"
            disabled={loading}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="District" error={errors.district}>
          <select
            className={input(errors.district)}
            value={form.district}
            onChange={e => set('district', e.target.value)}
            disabled={loading}
          >
            <option value="">Select district</option>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>

        <Field label="Sector" error={errors.sector}>
          <input
            className={input(errors.sector)}
            value={form.sector}
            onChange={e => set('sector', e.target.value)}
            placeholder="e.g. Kimironko"
            disabled={loading}
          />
        </Field>
      </div>

      <Field label="Image URL (optional)">
        <input
          className={input()}
          value={form.imageUrl}
          onChange={e => set('imageUrl', e.target.value)}
          placeholder="https://example.com/image.jpg"
          disabled={loading}
        />
      </Field>

      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Submitting…' : 'Submit for Approval'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function input(error?: string) {
  const base = 'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600'
  return error
    ? `${base} border-red-400 bg-red-50`
    : `${base} border-gray-300 bg-white`
}

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

import { useRef, useState } from 'react'
import {
  AlertCircle,
  Building2,
  Check,
  Image as ImageIcon,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import AvatarCropModal from '@/components/student/AvatarCropModal'
import { type IOpportunity } from '@/demo/studentDemoData'

interface AdminCreateOpportunityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (opportunityData: Partial<IOpportunity>, logoBlobOrUrl?: string) => void
  initialData?: Partial<IOpportunity> | null
}

const CATEGORIES = [
  'Scholarship',
  'internship',
  'hackathon',
  'competition',
  'fellowship',
  'research',
  'open Source',
  'workshop',
]

const ORG_TYPES = [
  'private',
  'government',
  'university',
  'nGO',
  'start-up',
  'non-Profit',
  'international organisation',
]

const EDUCATION_LEVELS = [
  'all',
  'undergraduate',
  'postgraduate',
  'phd',
  'high-school',
  'diploma',
]

export default function AdminCreateOpportunityModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AdminCreateOpportunityModalProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [organization, setOrganization] = useState(initialData?.organization || '')
  const [category, setCategory] = useState(initialData?.category || 'Scholarship')
  const [organizationType, setOrganizationType] = useState<any>(initialData?.organizationType || 'private')
  const [educationLevel, setEducationLevel] = useState('all')
  const [gender, setGender] = useState<any>(initialData?.gender || 'all')
  const [location, setLocation] = useState(initialData?.location || 'Remote')
  const [deadline, setDeadline] = useState(initialData?.deadline || '')
  const [applicationUrl, setApplicationUrl] = useState(initialData?.applicationUrl || '')
  const [officialSourceUrl, setOfficialSourceUrl] = useState(initialData?.officialSourceUrl || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [eligibilityText, setEligibilityText] = useState(
    Array.isArray(initialData?.eligibility) ? initialData?.eligibility.join('\n') : (initialData?.eligibility || '')
  )
  const [benefitsText, setBenefitsText] = useState(
    Array.isArray(initialData?.benefits) ? initialData?.benefits.join('\n') : (initialData?.benefits || '')
  )
  const [status, setStatus] = useState<any>(initialData?.status || 'active')

  // Logo upload and crop state
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.organizationLogo || null)
  const [rawImageForCrop, setRawImageForCrop] = useState<string | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formError, setFormError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleLogoFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Please select a valid image file.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setRawImageForCrop(reader.result as string)
        setCropModalOpen(true)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const handleSaveCroppedLogo = (croppedDataUrl: string) => {
    setLogoPreview(croppedDataUrl)
    setCropModalOpen(false)
    setRawImageForCrop(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!title.trim() || !organization.trim()) {
      setFormError('Title and Organization are required.')
      return
    }

    const eligibilityList = eligibilityText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const benefitsList = benefitsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload: Partial<IOpportunity> = {
      _id: initialData?._id || `opp_${Date.now()}`,
      title: title.trim(),
      organization: organization.trim(),
      organizationLogo: logoPreview || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&h=80&fit=crop',
      category,
      organizationType,
      gender,
      location: location.trim(),
      deadline: deadline || 'Open Ongoing',
      applicationUrl: applicationUrl.trim() || 'https://opportunityradar.org',
      officialSourceUrl: officialSourceUrl.trim() || 'https://opportunityradar.org',
      description: description.trim(),
      eligibility: eligibilityList,
      benefits: benefitsList,
      eligibilitySummary: eligibilityList[0] || 'Open to all eligible students',
      benefitsSummary: benefitsList[0] || 'Certificate + Mentorship',
      status,
      sourceStatus: 'live',
      updatedAt: new Date().toISOString(),
    }

    onSave(payload, logoPreview || undefined)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 sm:py-6 overflow-y-auto">
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl ring-1 ring-white/10 my-auto max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 size={20} className="text-blue-500" />
                {initialData ? 'Edit Opportunity' : 'Create New Opportunity'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fill in the details to publish an opportunity to the student network.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Logo Upload & Crop Preview */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-slate-500" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="text-xs font-semibold text-white">Organization Logo</div>
                <div className="text-[11px] text-slate-400">
                  Upload an official logo. You can crop and reposition it cleanly.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  <Upload size={14} />
                  <span>Choose Photo</span>
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => setLogoPreview(null)}
                    className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300"
                    title="Remove Logo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFilePick}
              />
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Opportunity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Summer Internship 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google LLC"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Org Type</label>
                <select
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  {ORG_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Education Level</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  {EDUCATION_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Genders</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="Remote, Hybrid, etc."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Deadlines & URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Application Deadline
                </label>
                <input
                  type="text"
                  placeholder="e.g. May 30, 2026"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Publish Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="active">Active (Published to Students)</option>
                  <option value="draft">Draft (Saved Privately)</option>
                  <option value="closed">Closed / Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Application URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Official Source / Verification URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={officialSourceUrl}
                  onChange={(e) => setOfficialSourceUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Opportunity Description
              </label>
              <textarea
                rows={3}
                placeholder="Comprehensive summary of what this opportunity entails..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Eligibility & Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Eligibility Criteria (one per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Undergraduate in STEM&#10;Minimum GPA 3.0"
                  value={eligibilityText}
                  onChange={(e) => setEligibilityText(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Benefits & Perks (one per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="$5,000 Stipend&#10;Executive Mentorship"
                  value={benefitsText}
                  onChange={(e) => setBenefitsText(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 active:scale-95"
              >
                <Check size={16} />
                <span>{initialData ? 'Update Opportunity' : 'Save & Publish'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Logo Cropper Modal */}
      {cropModalOpen && (
        <AvatarCropModal
          isOpen={cropModalOpen}
          imageSrc={rawImageForCrop}
          onClose={() => {
            setCropModalOpen(false)
            setRawImageForCrop(null)
          }}
          onSave={handleSaveCroppedLogo}
        />
      )}
    </>
  )
}

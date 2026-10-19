import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Check, Edit2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/components/AuthContext'
import { updateUserProfile } from '@/services/opportunityService'

export default function AdminProfilePage() {
  const navigate = useNavigate()
  const { user, refreshAuth } = useAuth()

  // Clean avatar helper to prevent hardcoded mock image
  const cleanAvatarUrl = (url?: string | null) => {
    if (!url) return null
    if (url.includes('images.unsplash.com/photo-1534528741775-53994a69daeb')) return null
    return url
  }

  // Profile data from storage or AuthContext
  const initialName =
    localStorage.getItem('admin_profile_name') ||
    user?.FullName ||
    user?.fullName ||
    user?.name ||
    'Administrator'

  const initialAvatar =
    cleanAvatarUrl(localStorage.getItem('admin_profile_avatar')) ||
    cleanAvatarUrl(typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url) ||
    cleanAvatarUrl(user?.avatarUrl) ||
    cleanAvatarUrl(user?.profilePicture) ||
    null

  const email = user?.email || 'admin@opportunityradar.org'

  // Display State
  const [fullName, setFullName] = useState(initialName)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar)

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(initialName)
  const [editAvatar, setEditAvatar] = useState<string | null>(initialAvatar)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Synchronize profile details when user is fetched or changes from AuthContext
  useEffect(() => {
    if (user) {
      const name =
        localStorage.getItem('admin_profile_name') ||
        user.FullName ||
        user.fullName ||
        user.name
      if (name) {
        setFullName(name)
        if (!isEditing) setEditName(name)
      }

      const avatar =
        cleanAvatarUrl(localStorage.getItem('admin_profile_avatar')) ||
        cleanAvatarUrl(typeof user.avatar === 'string' ? user.avatar : user.avatar?.url) ||
        cleanAvatarUrl(user.avatarUrl) ||
        cleanAvatarUrl(user.profilePicture)
      if (avatar) {
        setAvatarUrl(avatar)
        if (!isEditing) setEditAvatar(avatar)
        localStorage.setItem('admin_profile_avatar', avatar)
      }
    }
  }, [user, isEditing])

  // Photo Upload Handler (Supports PNG, JPEG, WebP)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPEG, or WebP).')
      return
    }

    // Keep the raw File object to send in multipart/form-data to the backend
    setAvatarFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setEditAvatar(result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Start editing
  const handleStartEdit = () => {
    setEditName(fullName)
    setEditAvatar(avatarUrl)
    setAvatarFile(null)
    setIsEditing(true)
    setSaveSuccess(false)
  }

  // Cancel editing
  const handleCancel = () => {
    setEditName(fullName)
    setEditAvatar(avatarUrl)
    setAvatarFile(null)
    setIsEditing(false)
    setSaveSuccess(false)
  }

  // Save changes (only Full Name and Profile Photo)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) {
      alert('Please enter your full name.')
      return
    }

    setIsSaving(true)
    const finalName = editName.trim()
    const finalAvatar = editAvatar

    try {
      // 1. Prepare FormData to send to backend API
      const formData = new FormData()
      formData.append('FullName', finalName)
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      let backendAvatarUrl: string | null = null

      // Sync with backend API (Multer upload to Cloudinary and MongoDB persistence)
      try {
        const response = await updateUserProfile(formData)
        const updatedUser = response?.data?.user || response?.data || response
        const serverAvatar =
          typeof updatedUser?.avatar === 'string'
            ? updatedUser.avatar
            : updatedUser?.avatar?.url || updatedUser?.avatarUrl
        if (serverAvatar) {
          backendAvatarUrl = cleanAvatarUrl(serverAvatar)
        }
        if (refreshAuth) {
          await refreshAuth()
        }
      } catch (apiErr) {
        console.warn('Backend sync note (persisted locally):', apiErr)
      }

      // 2. Persist in localStorage and state
      localStorage.setItem('admin_profile_name', finalName)
      const persistentAvatar = backendAvatarUrl || finalAvatar

      if (persistentAvatar) {
        localStorage.setItem('admin_profile_avatar', persistentAvatar)
      } else {
        localStorage.removeItem('admin_profile_avatar')
      }

      // Update local state
      setFullName(finalName)
      setAvatarUrl(persistentAvatar)
      setAvatarFile(null)
      setIsEditing(false)
      setIsSaving(false)
      setSaveSuccess(true)

      // Notify AdminLayout to immediately sync the top-bar profile info
      window.dispatchEvent(new Event('admin-profile-updated'))

      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save profile changes:', err)
      setIsSaving(false)
      alert('Failed to save changes. Please try again.')
    }
  }

  return (
    <AdminLayout activeTab="profile">
      {/* Light neutral page background with centered profile card */}
      <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40 rounded-3xl">
        {/* Navigation back to dashboard */}
        <div className="w-full max-w-[448px] mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 hover:border-blue-500/30 dark:hover:border-cyan-500/30 transition-all shadow-sm group cursor-pointer"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="w-full max-w-[448px] rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/60 px-6 py-8 sm:p-9 text-center transition-all animate-in fade-in">
          {/* Success Banner */}
          {saveSuccess && (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Check size={14} />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {!isEditing ? (
            /* VIEW MODE: Displays ONLY Profile photo, Full name, Email address, and Edit Profile button */
            <div>
              {/* Profile Image: 112×112, circular, object-cover, center crop. If none, shows skeleton person silhouette */}
              <div className="mx-auto flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-[112px] h-[112px] rounded-full object-cover object-center ring-4 ring-blue-500/20 shadow-md shadow-blue-500/10 select-none"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  <div className="w-[112px] h-[112px] rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700/80 ring-4 ring-blue-500/20 shadow-md shadow-blue-500/10 flex items-end justify-center select-none">
                    <svg
                      className="h-full w-full text-slate-400 dark:text-slate-500 pt-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Full Name */}
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {fullName}
              </h1>

              {/* Email Address */}
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                {email}
              </p>

              {/* Action Buttons: Edit Profile and Back to Dashboard */}
              <div className="mt-8 space-y-2.5">
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all cursor-pointer"
                >
                  <Edit2 size={16} />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </div>
          ) : (
            /* EDIT MODE: Allows ONLY Changing profile photo and Changing full name. Email is visible but read-only. */
            <form onSubmit={handleSave} className="space-y-6">
              {/* Profile photo upload & preview: 112×112 with camera button */}
              <div className="relative mx-auto w-[112px] h-[112px]">
                {editAvatar ? (
                  <img
                    src={editAvatar}
                    alt={editName}
                    className="w-[112px] h-[112px] rounded-full object-cover object-center ring-4 ring-blue-500/25 shadow-md shadow-blue-500/10 select-none"
                    onError={() => setEditAvatar(null)}
                  />
                ) : (
                  <div className="w-[112px] h-[112px] rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700/80 ring-4 ring-blue-500/25 shadow-md shadow-blue-500/10 flex items-end justify-center select-none">
                    <svg
                      className="h-full w-full text-slate-400 dark:text-slate-500 pt-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-500 ring-2 ring-white dark:ring-slate-900 transition-colors cursor-pointer"
                  title="Change photo (PNG, JPEG, WebP)"
                >
                  <Camera size={15} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Upload new photo (PNG, JPEG, WebP)
                </button>
                {editAvatar && (
                  <>
                    <span className="text-slate-400 text-xs">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditAvatar(null)
                        setAvatarFile(null)
                      }}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove photo
                    </button>
                  </>
                )}
              </div>

              {/* Full Name Input */}
              <div className="text-left space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* Email Address Input: Visible but READ-ONLY */}
              <div className="text-left space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 px-3.5 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
                />
                <p className="text-[11px] text-slate-400">
                  Email address is associated with administrator credentials and is read-only.
                </p>
              </div>

              {/* Actions: Cancel & Save changes */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Pencil,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import StudentLayout from "@/components/layout/StudentLayout";
import AvatarCropModal, {
  PersonSkeletonAvatar,
} from "@/components/student/AvatarCropModal";
import { getUserProfile, updateUserProfile } from "@/services/opportunityService";
import { useAuth } from "@/components/AuthContext";

interface ProfileData {
  name: string;
  email: string;
  college: string;
  branch: string;
  year: string;
  skills: string[];
  interests: string[];
  avatarUrl?: string | null;
}

const INITIAL_PROFILE: ProfileData = {
  name: "",
  email: "",
  college: "",
  branch: "",
  year: "",
  skills: [],
  interests: [],
  avatarUrl: null,
};

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

function TagEditor({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");

  function addTag() {
    const tag = value.trim();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setValue("");
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="flex min-h-11 flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((item) => item !== tag))}
              aria-label={`Remove ${tag}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder={tags.length ? "" : placeholder}
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const { user: authUser, refreshAuth } = useAuth();

  const [saved, setSaved] = useState<ProfileData>(() => {
    if (authUser) {
      const avatar =
        (typeof authUser.avatar === "string" ? authUser.avatar : authUser.avatar?.url) ||
        authUser.avatarUrl ||
        authUser.profilePicture ||
        null;

      return {
        name: authUser.FullName || authUser.fullName || authUser.name || "",
        email: authUser.email || "",
        college: authUser.college || authUser.university || "",
        branch: authUser.branch || "",
        year: authUser.year || "",
        skills: Array.isArray(authUser.skills) ? authUser.skills : [],
        interests: Array.isArray(authUser.interests) ? authUser.interests : [],
        avatarUrl: avatar,
      };
    }
    return INITIAL_PROFILE;
  });

  const [draft, setDraft] = useState<ProfileData>(saved);
  const [editing, setEditing] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // -------------------------------------------------------------
  // PHOTO UPLOAD & CIRCLE CROP STATE
  // -------------------------------------------------------------
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state as soon as authUser from AuthContext loads
  useEffect(() => {
    if (authUser) {
      const avatar =
        (typeof authUser.avatar === "string" ? authUser.avatar : authUser.avatar?.url) ||
        authUser.avatarUrl ||
        authUser.profilePicture ||
        null;

      setSaved((prev) => ({
        ...prev,
        name: authUser.FullName || authUser.fullName || authUser.name || prev.name,
        email: authUser.email || prev.email,
        college: authUser.college || authUser.university || prev.college,
        branch: authUser.branch || prev.branch,
        year: authUser.year || prev.year,
        skills: Array.isArray(authUser.skills) ? authUser.skills : prev.skills,
        interests: Array.isArray(authUser.interests) ? authUser.interests : prev.interests,
        avatarUrl: avatar !== null ? avatar : prev.avatarUrl,
      }));
    }
  }, [authUser]);

  // Sync draft if saved changes
  useEffect(() => {
    setDraft(saved);
  }, [saved]);

  // Fetch user profile details from backend API on page load
  useEffect(() => {
    const fetchUserProfileDetails = async () => {
      try {
        console.log("Fetching profile details from API...");
        const response = await getUserProfile();
        console.log("User profile response from backend:", response);

        // Extract user data from response (handles response.data or response.data.data)
        const user = response?.data?.user || response?.data?.data || response?.data || response;

        if (user) {
          const avatar =
            (typeof user.avatar === "string" ? user.avatar : user.avatar?.url) ||
            user.avatarUrl ||
            user.profilePicture ||
            null;

          const profileData: ProfileData = {
            name: user.FullName || user.fullName || user.name || "",
            email: user.email || "",
            college: user.college || user.university || "",
            branch: user.branch || "",
            year: user.year || "",
            skills: Array.isArray(user.skills) ? user.skills : [],
            interests: Array.isArray(user.interests) ? user.interests : [],
            avatarUrl: avatar,
          };

          if (avatar) {
            localStorage.setItem("student_profile_avatar", avatar);
            window.dispatchEvent(new Event("profile-avatar-updated"));
          }

          setSaved(profileData);
          setDraft(profileData);
        }
      } catch (error) {
        console.error("Failed to fetch profile details from API:", error);
      }
    };

    fetchUserProfileDetails();
  }, []);



  const completion = Math.round(
    ([saved.name, saved.email, saved.college, saved.branch, saved.year].filter(
      Boolean,
    ).length /
      5) *
      60 +
      (saved.skills.length ? 20 : 0) +
      (saved.interests.length ? 20 : 0),
  );

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
  const readClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200";

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSavedNotice(null);
  }

async function saveProfile() {
  try {
    const formData = new FormData();

    // 1. Text fields
    formData.append("FullName", draft.name);
    formData.append("college", draft.college);
    formData.append("branch", draft.branch);
    formData.append("year", draft.year);

    // 2. Arrays
    formData.append("skills", JSON.stringify(draft.skills));
    formData.append("interests", JSON.stringify(draft.interests));

    // 3. Original image file (only attached if user picked a new photo)
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    console.log("Saving full profile to backend via single API call...");

    // 4. Single API Call
    const response = await updateUserProfile(formData);
    console.log("Backend response:", response);

    const updatedUser = response?.data?.user || response?.data?.data || response?.data || response?.user;
    const serverAvatar =
      (typeof updatedUser?.avatar === "string" ? updatedUser?.avatar : updatedUser?.avatar?.url) ||
      updatedUser?.avatarUrl ||
      updatedUser?.profilePicture;

    const finalProfile: ProfileData = {
      ...draft,
      ...(serverAvatar ? { avatarUrl: serverAvatar } : {}),
    };

    setSaved(finalProfile);
    setDraft(finalProfile);
    if (finalProfile.avatarUrl) {
      localStorage.setItem("student_profile_avatar", finalProfile.avatarUrl);
      window.dispatchEvent(new Event("profile-avatar-updated"));
    }

    // Synchronize AuthContext so navbar updates immediately
    await refreshAuth();

    setEditing(false);
    setAvatarFile(null); // Reset after successful save
    setSavedNotice("Profile updated successfully!");
    setTimeout(() => setSavedNotice(null), 3000);
  } catch (error) {
    console.error("Failed to update profile:", error);
    setSavedNotice("Failed to save profile to server");
  }
}

  // -------------------------------------------------------------
  // IMAGE SELECTION & CROP HANDLERS
  // -------------------------------------------------------------
 const processImageFile = (file: File) => {
  if (!file.type.startsWith("image/")) {
    alert("Please upload a valid image file.");
    return;
  }

  // Save the original binary file for the final API call
  setAvatarFile(file);

  // Read data URL for the cropper modal preview
  const reader = new FileReader();
  reader.onload = () => {
    setRawImageForCrop(reader.result as string);
    setCropModalOpen(true);
  };
  reader.readAsDataURL(file);
};

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset file input so selecting the same file again triggers change
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSaveCroppedAvatar = (croppedDataUrl: string) => {
  setDraft((prev) => ({ ...prev, avatarUrl: croppedDataUrl }));
  setSaved((prev) => ({ ...prev, avatarUrl: croppedDataUrl }));
  setEditing(true); // Automatically open edit mode so "Save changes" is visible
  setCropModalOpen(false);
  setRawImageForCrop(null);
  setSavedNotice("Photo cropped! Click 'Save changes' to update your profile.");
};


 
  const handleRemoveAvatar = () => {
    setSaved((prev) => ({ ...prev, avatarUrl: null }));
    setDraft((prev) => ({ ...prev, avatarUrl: null }));
    localStorage.removeItem("student_profile_avatar");

    // Notify listeners
    window.dispatchEvent(new Event("profile-avatar-updated"));

    setSavedNotice("Profile photo removed. Reverted to default avatar.");
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <StudentLayout activePage="profile">
      {/* Hidden File Input for Device Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Professional Circular Image Cropping Modal */}
      {cropModalOpen && (
        <AvatarCropModal
          isOpen={cropModalOpen}
          imageSrc={rawImageForCrop}
          onClose={() => {
            setCropModalOpen(false);
            setRawImageForCrop(null);
          }}
          onSave={handleSaveCroppedAvatar}
        />
      )}

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              My Profile
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Manage your personal information, photo, and preferences
            </p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              <Pencil size={14} /> Edit profile
            </button>
          )}
        </div>

        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-7">
          {/* Aside: Profile Photo & Card */}
          <aside className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-700 dark:bg-slate-800">
            {/* Avatar Container with Circle Mask and Drag-and-Drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group relative flex flex-col items-center justify-center rounded-full transition-all duration-200 ${
                isDragOver ? "scale-105 ring-4 ring-blue-500/50" : ""
              }`}
            >
              {saved.avatarUrl ? (
                /* Cropped Circular Photo */
                <img
                  src={saved.avatarUrl}
                  alt={saved.name}
                  className="h-28 w-28 rounded-full border-2 border-white object-cover shadow-md ring-4 ring-blue-500/15 dark:border-slate-700 dark:ring-blue-400/20"
                />
              ) : (
                /* Default: Professional Person Skeleton */
                <PersonSkeletonAvatar className="h-28 w-28 ring-4 ring-slate-200/50 dark:ring-slate-700/50" />
              )}

              {/* Floating Camera Button Badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title={saved.avatarUrl ? "Change photo" : "Upload photo"}
                className="absolute bottom-0.5 right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700 active:scale-95 dark:border-slate-800"
              >
                <Camera size={14} />
              </button>
            </div>

            {/* Photo Action Links */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Upload size={12} />
                {saved.avatarUrl ? "Change photo" : "Upload photo"}
              </button>

              {saved.avatarUrl && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                </>
              )}
            </div>

            <div className="text-center">
              <p className="font-semibold text-slate-900 dark:text-white">
                {saved.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {saved.email}
              </p>
            </div>

            {(saved.year || saved.branch) && (
              <div className="flex w-full flex-wrap justify-center gap-1.5">
                {saved.year && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {saved.year}
                  </span>
                )}
                {saved.branch && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {saved.branch}
                  </span>
                )}
              </div>
            )}

            {/* Profile Completeness */}
            <div className="w-full border-t border-slate-100 pt-3 dark:border-slate-700">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Profile completeness
                </span>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  {completion}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                A complete profile helps us match better opportunities.
              </p>
            </div>
          </aside>

          {/* Form Sections */}
          <div className="flex flex-col gap-5">
            {/* Basic Information */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Basic information
              </h2>
              <div className="grid gap-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full name
                  <input
                    value={draft.name}
                    disabled={!editing}
                    onChange={(event) => update("name", event.target.value)}
                    className={editing ? fieldClass : readClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email address
                  <input
                    value={draft.email}
                    disabled={!editing}
                    onChange={(event) => update("email", event.target.value)}
                    className={editing ? fieldClass : readClass}
                  />
                </label>
              </div>
            </section>

            {/* Academic Details */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Academic details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
                  College / University
                  <input
                    value={draft.college}
                    disabled={!editing}
                    onChange={(event) => update("college", event.target.value)}
                    className={editing ? fieldClass : readClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Branch / Major
                  <input
                    value={draft.branch}
                    disabled={!editing}
                    placeholder="e.g. Computer Science & Engineering"
                    onChange={(event) => update("branch", event.target.value)}
                    className={editing ? fieldClass : readClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Year of study
                  {editing ? (
                    <select
                      value={draft.year}
                      onChange={(event) => update("year", event.target.value)}
                      className={fieldClass}
                    >
                      <option value="" disabled>
                        Select Year
                      </option>
                      {YEAR_OPTIONS.map((yearOption) => (
                        <option key={yearOption} value={yearOption}>
                          {yearOption}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={readClass}>
                      {saved.year || "Not specified"}
                    </span>
                  )}
                </label>
              </div>
            </section>

            {/* Skills & Interests */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-5 flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                  Skills & interests
                </h2>
                <span className="text-[11px] text-slate-400">
                  Used for opportunity matching
                </span>
              </div>
              {editing ? (
                <div className="flex flex-col gap-5">
                  <TagEditor
                    label="Skills"
                    tags={draft.skills}
                    onChange={(tags) => update("skills", tags)}
                    placeholder="Type a skill and press Enter..."
                  />
                  <TagEditor
                    label="Interests"
                    tags={draft.interests}
                    onChange={(tags) => update("interests", tags)}
                    placeholder="Type an interest and press Enter..."
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {saved.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Interests
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {saved.interests.map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Edit Mode Buttons & Feedback */}
            {editing && (
              <div className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(saved);
                    setEditing(false);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                >
                  <Check size={14} /> Save changes
                </button>
              </div>
            )}

            {savedNotice && (
              <p className="text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                ✓ {savedNotice}
              </p>
            )}
          </div>
        </div>
      </main>
    </StudentLayout>
  );
}

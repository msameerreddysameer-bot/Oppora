import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Crop,
  FileCheck2,
  FileText,
  Gift,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import CroppedLogoPreview from "@/components/admin/CroppedLogoPreview";
import LogoCropModal from "@/components/admin/LogoCropModal";
import { type IOpportunity, type LogoCrop } from "@/types/studentTypesData";
import {
  apiCreateOpportunity as apiCreateOpportunity,
  apiEditOpportunity as apiEditOpportunity,
  getOpportunitiesById as apiGetOpportunitiesById,
} from "@/services/opportunityService";

const CATEGORIES = [
  "Scholarship",
  "internship",
  "hackathon",
  "competition",
  "fellowship",
  "research",
  "open Source",
  "workshop",
];

const ORG_TYPES = [
  "private",
  "government",
  "university",
  "nGO",
  "start-up",
  "non-Profit",
  "international organisation",
];

// Exactly 7 Sections
type FormSection =
  | "basic"
  | "details"
  | "eligibility"
  | "benefits"
  | "documents"
  | "dates"
  | "links";

/**
 * Helper to convert a base64 Data URL (from canvas crop) into a true binary File object.
 * This guarantees your backend receives req.file as an actual image file.
 */
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1]); // Decodes base64 string to raw binary string
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  // Creates a real File object ready for upload!
  return new File([u8arr], filename, { type: mime });
}

const SECTIONS: Array<{
  id: FormSection;
  title: string;
  number: number;
  icon: any;
}> = [
  { id: "basic", title: "Basic information", number: 1, icon: Building2 },
  { id: "details", title: "Opportunity details", number: 2, icon: FileText },
  { id: "eligibility", title: "Eligibility", number: 3, icon: Sparkles },
  { id: "benefits", title: "Benefits", number: 4, icon: Gift },
  { id: "documents", title: "Required documents", number: 5, icon: FileCheck2 },
  { id: "dates", title: "Important dates", number: 6, icon: Calendar },
  { id: "links", title: "Links", number: 7, icon: LinkIcon },
];

export default function AdminCreateOpportunityPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const isEditMode = Boolean(editId);

  // Active section (1 through 7)
  const [activeSection, setActiveSection] = useState<FormSection>("basic");

  // Form State: 1. Basic information
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [category, setCategory] = useState("Scholarship");
  const [organizationType, setOrganizationType] = useState<any>("private");
  const [location, setLocation] = useState("Remote");
  const [educationLevel, setEducationLevel] = useState<
    "high-school" | "diploma" | "undergraduate" | "postgraduate" | "phd"
  >("undergraduate");

  // Logo state: Original image + Normalized crop metadata + Cropped preview
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [savedCrop, setSavedCrop] = useState<LogoCrop | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State: 2. Opportunity details (One textarea approx 9 rows, resizable vertically)
  const [description, setDescription] = useState("");

  // Form State: 3. Eligibility
  const [eligibilitySummary, setEligibilitySummary] = useState("");
  const [eligibilityList, setEligibilityList] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");

  // Form State: 4. Benefits
  const [benefitsSummary, setBenefitsSummary] = useState("");
  const [benefitsList, setBenefitsList] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState("");

  // Form State: 5. Required documents (Starts empty for custom additions)
  const [documentsList, setDocumentsList] = useState<string[]>([]);
  const [newDocument, setNewDocument] = useState("");

  // Form State: 6. Important dates (Only Start Date & Application Deadline)
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");

  // Form State: 7. Links (Final Section)
  const [officialSourceUrl, setOfficialSourceUrl] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");

  // Prefill helper
  const populateForm = (data: IOpportunity) => {
    // 1. Basic Information
    setTitle(data.title || "");
    setOrganization(data.organization || "");
    setCategory(data.category || "Scholarship");
    setOrganizationType(data.organizationType || "private");
    setLocation(data.location || "Remote");

    // 2. Opportunity Details
    setDescription(data.description || "");

    // 3. Eligibility
    setEligibilitySummary(data.eligibilitySummary || "");
    setEligibilityList(Array.isArray(data.eligibility) ? data.eligibility : []);

    // 4. Benefits
    setBenefitsSummary(data.benefitsSummary || "");
    setBenefitsList(Array.isArray(data.benefits) ? data.benefits : []);

    // 5. Required Documents
    setDocumentsList(
      Array.isArray(data.requiredDocuments) ? data.requiredDocuments : []
    );

    // 6. Important Dates
    setStartDate(data.startDate || "");
    setDeadline(data.deadline || "");

    // 7. Links
    setOfficialSourceUrl(data.officialSourceUrl || "");
    setApplicationUrl(data.applicationUrl || "");

    if ((data as any).educationLevel) {
      setEducationLevel((data as any).educationLevel);
    }

    // Organization Logo & Saved Crop coordinates
    const logoSrc = data.originalLogo || data.organizationLogo || null;
    setOriginalImage(logoSrc);
    setCroppedPreview(data.organizationLogo || logoSrc);
    if (data.logoCrop) {
      setSavedCrop(data.logoCrop);
    }
  };

  // =========================================================================
  // [BACKEND API INTEGRATION POINT 1: FETCH OPPORTUNITY BY ID FOR EDITING]
  // =========================================================================
  // Hits GET /opportunity/:id via opportunityService.getOpportunitiesById()
  useEffect(() => {
    if (!editId) return;

    let isMounted = true;

    // 1. Check local cache first for instant form prefill
    try {
      const saved = localStorage.getItem("admin_managed_opportunities");
      if (saved) {
        const list: IOpportunity[] = JSON.parse(saved);
        const found = list.find((o) => o._id === editId);
        if (found) {
          populateForm(found);
        }
      }
    } catch {
      // Local cache unavailable
    }

    // 2. Fetch fresh opportunity record from Backend Server
    const fetchFreshData = async () => {
      try {
        const res = await apiGetOpportunitiesById(editId);
        const oppData: IOpportunity = res?.data || res;
        if (isMounted && oppData && oppData.title) {
          populateForm(oppData);
        }
      } catch {
        // Backend API not reachable, working with local cache
      }
    };

    fetchFreshData();
    return () => {
      isMounted = false;
    };
  }, [editId]);

  // Validation State
  const [formError, setFormError] = useState<string | null>(null);
  const [activeErrorField, setActiveErrorField] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Redirect to missing field and highlight with red boundary
  const scrollToField = (
    fieldId: string,
    section: FormSection,
    message: string
  ) => {
    setFormError(message);
    setActiveErrorField(fieldId);
    setActiveSection(section);

    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
    }, 150);
  };

  // Handle Logo Upload File (PNG, JPG/JPEG, SVG, WebP)
  const handleLogoFile = (file: File) => {
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      setFormError(
        "Please upload a valid image (PNG, JPG/JPEG, SVG, or WebP)."
      );
      return;
    }
    setLogoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setOriginalImage(resultStr);
      // Open crop modal immediately for 1:1 square crop
      setCropModalOpen(true);
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleLogoFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Save crop result from LogoCropModal
  const handleCropSave = (result: {
    croppedPreviewUrl: string;
    originalImageUrl: string;
    crop: LogoCrop;
  }) => {
    setOriginalImage(result.originalImageUrl);
    setSavedCrop(result.crop);
    setCroppedPreview(result.croppedPreviewUrl);
    setCropModalOpen(false);
    setFormError(null);
    if (activeErrorField === "field-logo") {
      setActiveErrorField(null);
    }
  };

  // Remove image
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setOriginalImage(null);
    setSavedCrop(null);
    setCroppedPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Eligibility list helpers
  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setEligibilityList([...eligibilityList, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setEligibilityList(eligibilityList.filter((_, i) => i !== index));
  };

  // Benefits list helpers
  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setBenefitsList([...benefitsList, newBenefit.trim()]);
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefitsList(benefitsList.filter((_, i) => i !== index));
  };

  // Required documents list helpers (matching Benefits)
  const handleAddDocument = () => {
    if (newDocument.trim()) {
      setDocumentsList([...documentsList, newDocument.trim()]);
      setNewDocument("");
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocumentsList(documentsList.filter((_, i) => i !== index));
  };

  // Stepper navigation
  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection);

  const handleNextSection = () => {
    setFormError(null);
    if (currentIndex < SECTIONS.length - 1) {
      setActiveSection(SECTIONS[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevSection = () => {
    setFormError(null);
    if (currentIndex > 0) {
      setActiveSection(SECTIONS[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Final Save Handler (Publish Live or Save as Draft)
  const handleSaveAction = async (publicationMode: "published" | "draft") => {
    setFormError(null);
    setActiveErrorField(null);

    if (publicationMode === "published") {
      // Strict validation rules for publishing live
      if (!originalImage && !croppedPreview) {
        scrollToField(
          "field-logo",
          "basic",
          "Organization logo is required before publishing. Please upload a logo."
        );
        return;
      }
      if (!organization.trim()) {
        scrollToField(
          "field-organization",
          "basic",
          "Organization name is required."
        );
        return;
      }
      if (!title.trim()) {
        scrollToField("field-title", "basic", "Opportunity title is required.");
        return;
      }
      if (!deadline.trim()) {
        scrollToField(
          "field-deadline",
          "dates",
          "Application deadline is required for publishing."
        );
        return;
      }
      if (!applicationUrl.trim()) {
        scrollToField(
          "field-applicationUrl",
          "links",
          "Application portal URL is required."
        );
        return;
      }
    } else {
      // Saving as draft requires at least title or organization to identify it
      if (!title.trim() && !organization.trim()) {
        scrollToField(
          "field-title",
          "basic",
          "Please enter a title or organization name to save as draft."
        );
        return;
      }
    }

    setIsPublishing(true);

    const finalLogoUrl =
      croppedPreview ||
      originalImage ||
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&h=80&fit=crop";

    // 1. Create a fresh FormData instance
    const formData = new FormData();

    // 2. Normalize enums and types for backend Zod validation schema
    const backendCategoryMap: Record<string, string> = {
      scholarship: "Scholarship",
      internship: "intership", // Notice: backend schema specifies 'intership'
      intership: "intership",
      hackathon: "hackathon",
      competition: "competition",
      fellowship: "fellowship",
      research: "research",
      "open source": "open-source",
      "open-source": "open-source",
      workshop: "workshop",
    };

    const backendOrgTypeMap: Record<string, string> = {
      government: "government",
      private: "private",
      university: "university",
      ngo: "ngo",
      "start-up": "start-up",
      startup: "start-up",
      "non-profit": "non-profit",
      "non-Profit": "non-profit",
      "international organisation": "international-organisation",
      "international-organisation": "international-organisation",
    };

    const normalizedCategory =
      backendCategoryMap[category.toLowerCase().trim()] || "Scholarship";
    const normalizedOrgType =
      backendOrgTypeMap[organizationType.toLowerCase().trim()] || "private";

    // Backend requires valid date strings that z.coerce.date() can parse
    const validStartDate =
      startDate.trim() && !isNaN(Date.parse(startDate.trim()))
        ? new Date(startDate.trim()).toISOString()
        : new Date().toISOString();

    const validDeadline =
      deadline.trim() && !isNaN(Date.parse(deadline.trim()))
        ? new Date(deadline.trim()).toISOString()
        : new Date(Date.now() + 30 * 86400000).toISOString();

    // 3. Add text fields (key, value)
    formData.append("title", title.trim() || "Untitled Opportunity");
    formData.append("organization", organization.trim() || "Organization");
    formData.append("category", normalizedCategory);
    formData.append("organizationType", normalizedOrgType);
    formData.append("location", location.trim() || "Remote");
    formData.append(
      "description",
      description.trim() ||
        `${title.trim() || "Opportunity"} offered by ${organization.trim() || "Organization"}`
    );
    formData.append(
      "eligibilitySummary",
      eligibilitySummary.trim() || "Open to all eligible students"
    );
    formData.append(
      "benefitsSummary",
      benefitsSummary.trim() || "Competitive benefits & mentorship"
    );
    formData.append("startDate", validStartDate);
    formData.append("deadline", validDeadline);
    formData.append(
      "officialSourceUrl",
      officialSourceUrl.trim() || applicationUrl.trim() || "https://google.com"
    );
    formData.append(
      "applicationUrl",
      applicationUrl.trim() || "https://google.com"
    );
    formData.append("educationLevel", educationLevel || "undergraduate");
    formData.append(
      "status",
      publicationMode === "published" ? "active" : "draft"
    );
    formData.append("publicationStatus", publicationMode);
    formData.append("sourceStatus", "live");
    formData.append("gender", "all");

    // -------------------------------------------------------------
    // Array 1: Benefits (Multer requires multiple keys to parse as Array)
    // -------------------------------------------------------------
    const activeBenefits = benefitsList.map((b) => b.trim()).filter(Boolean);
    if (activeBenefits.length === 0) {
      formData.append("benefits", "Competitive benefits & mentorship");
      formData.append("benefits", "Official Recognition");
    } else if (activeBenefits.length === 1) {
      formData.append("benefits", activeBenefits[0]);
      formData.append("benefits", activeBenefits[0]);
    } else {
      activeBenefits.forEach((benefit) => {
        formData.append("benefits", benefit);
      });
    }

    // -------------------------------------------------------------
    // Array 2: Required Documents
    // -------------------------------------------------------------
    const activeDocuments = documentsList.map((d) => d.trim()).filter(Boolean);
    if (activeDocuments.length === 1) {
      formData.append("requiredDocuments", activeDocuments[0]);
      formData.append("requiredDocuments", activeDocuments[0]);
    } else {
      activeDocuments.forEach((doc) => {
        formData.append("requiredDocuments", doc);
      });
    }

    // -------------------------------------------------------------
    // Array 3: Eligibility Requirements
    // -------------------------------------------------------------
    const activeEligibility = eligibilityList
      .map((e) => e.trim())
      .filter(Boolean);
    if (activeEligibility.length === 0) {
      formData.append("eligibility", "All eligible applicants");
      formData.append("eligibility", "Enrolled students worldwide");
    } else if (activeEligibility.length === 1) {
      formData.append("eligibility", activeEligibility[0]);
      formData.append("eligibility", activeEligibility[0]);
    } else {
      activeEligibility.forEach((req) => {
        formData.append("eligibility", req);
      });
    }

    // -------------------------------------------------------------
    // Logo File Attachment
    // -------------------------------------------------------------
    if (croppedPreview && croppedPreview.startsWith("data:")) {
      // Cropped image: Convert base64 canvas to a real binary file
      const fileName = logoFile?.name
        ? `cropped-${logoFile.name}`
        : "organization-logo.png";
      const binaryFile = dataURLtoFile(croppedPreview, fileName);
      formData.append("organizationLogo", binaryFile);
    } else if (logoFile) {
      // Uncropped image: Attach raw file directly
      formData.append("organizationLogo", logoFile);
    } else if (finalLogoUrl) {
      // Existing remote URL (for edit mode)
      formData.append("organizationLogoUrl", finalLogoUrl);
    }

    // Optional: Save crop coordinates JSON
    if (savedCrop) {
      formData.append("logoCrop", JSON.stringify(savedCrop));
    }

    try {
      const existingStr = localStorage.getItem("admin_managed_opportunities");
      let list: IOpportunity[] = [];
      if (existingStr) {
        try {
          list = JSON.parse(existingStr);
        } catch {
          list = [];
        }
      }

      if (isEditMode && editId) {
        const index = list.findIndex((o) => o._id === editId);
        const updatedItem: IOpportunity = {
          _id: editId,
          title: title.trim() || "Untitled Opportunity",
          organization: organization.trim() || "Organization",
          organizationLogo: finalLogoUrl,
          originalLogo: originalImage || undefined,
          logoCrop: savedCrop || undefined,
          category: category,
          gender: "all",
          sourceStatus: "live",
          organizationType: organizationType,
          status: publicationMode === "published" ? "active" : "draft",
          publicationStatus: publicationMode,
          startDate: startDate.trim() || undefined,
          deadline: deadline.trim() || "TBD",
          location: location.trim() || "Remote",
          description: description.trim() || "",
          benefits:
            benefitsList.length > 0 ? benefitsList : ["Official Recognition"],
          benefitsSummary:
            benefitsSummary.trim() || "Competitive benefits & mentorship",
          eligibility:
            eligibilityList.length > 0
              ? eligibilityList
              : ["All eligible students"],
          eligibilitySummary:
            eligibilitySummary.trim() || "Open to all students",
          officialSourceUrl:
            officialSourceUrl.trim() || applicationUrl.trim() || "#",
          applicationUrl: applicationUrl.trim() || "#",
          requiredDocuments: documentsList,
          createdAt:
            index >= 0 && list[index].createdAt
              ? list[index].createdAt
              : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (index >= 0) {
          list[index] = updatedItem;
        } else {
          list = [updatedItem, ...list];
        }
        localStorage.setItem(
          "admin_managed_opportunities",
          JSON.stringify(list)
        );

        // =====================================================================
        // [BACKEND API INTEGRATION POINT 2: UPDATE OPPORTUNITY]
        // =====================================================================
        // Hits PATCH /opportunity/:id via opportunityService.editOpportunity()

        try {
          await apiEditOpportunity(editId, formData);
        } catch {
          // Silently proceed
        }
      } else {
        const newOpportunity: IOpportunity = {
          _id: `opp_${Date.now()}`,
          title: title.trim() || "Untitled Draft Opportunity",
          organization: organization.trim() || "Draft Organization",
          organizationLogo: finalLogoUrl,
          originalLogo: originalImage || undefined,
          logoCrop: savedCrop || undefined,
          category: category,
          gender: "all",
          sourceStatus: "live",
          organizationType: organizationType,
          status: publicationMode === "published" ? "active" : "draft",
          publicationStatus: publicationMode,
          startDate: startDate.trim() || undefined,
          deadline: deadline.trim() || "TBD",
          location: location.trim() || "Remote",
          description:
            description.trim() ||
            `${title.trim() || "Opportunity"} offered by ${organization.trim() || "organization"} for students worldwide.`,
          benefits:
            benefitsList.length > 0 ? benefitsList : ["Official Recognition"],
          benefitsSummary:
            benefitsSummary.trim() || "Competitive benefits & mentorship",
          eligibility:
            eligibilityList.length > 0
              ? eligibilityList
              : ["All eligible students"],
          eligibilitySummary:
            eligibilitySummary.trim() || "Open to all students",
          officialSourceUrl:
            officialSourceUrl.trim() || applicationUrl.trim() || "#",
          applicationUrl: applicationUrl.trim() || "#",
          requiredDocuments: documentsList,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedList = [newOpportunity, ...list];
        localStorage.setItem(
          "admin_managed_opportunities",
          JSON.stringify(updatedList)
        );

        // =====================================================================
        // [BACKEND API INTEGRATION POINT 3: CREATE NEW OPPORTUNITY]
        // =====================================================================
        // Hits POST /opportunity/ via opportunityService.createOpportunity()
        try {
          const res = await apiCreateOpportunity(formData);

          // If backend returns the saved MongoDB ID, assign it:
          const backendId = res?.data?._id || res?._id;
          if (backendId) {
            newOpportunity._id = backendId;
          }
        } catch (apiErr: any) {
          const errMsg =
            apiErr?.response?.data?.message ||
            apiErr?.response?.data?.error ||
            apiErr?.message ||
            "Failed to create opportunity on backend server.";
          setFormError(errMsg);
          setIsPublishing(false);
          return;
        }
      }

      setTimeout(() => {
        setIsPublishing(false);
        navigate("/admin/opportunities");
      }, 300);
    } catch {
      setIsPublishing(false);
      setFormError(
        "Failed to save opportunity. Please check local storage capacity."
      );
    }
  };

  return (
    <AdminLayout activeTab={isEditMode ? "opportunities" : "create"}>
      <div className="w-full max-w-7xl mx-auto space-y-6 overflow-x-hidden">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Link to="/admin" className="hover:text-white transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <Link
                to="/admin/opportunities"
                className="hover:text-white transition-colors"
              >
                Opportunities
              </Link>
              <span>/</span>
              <span className="text-cyan-400">
                {isEditMode ? "Edit opportunity" : "Create Opportunity"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              {isEditMode ? "Edit opportunity" : "Create Opportunity"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isEditMode
                ? "Update every detail of this opportunity"
                : "Fill in the required information to publish a new student opportunity"}
            </p>
          </div>
          <Link
            to="/admin/opportunities"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors self-start sm:self-auto"
          >
            <ArrowLeft size={14} />
            <span>Back to Opportunities</span>
          </Link>
        </div>

        {/* Global Error Alert Banner (if validation redirected) */}
        {formError && (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-rose-500/50 bg-rose-500/10 p-4 sm:p-5 text-xs sm:text-sm font-semibold text-rose-300 shadow-xl animate-in fade-in">
            <AlertCircle size={22} className="shrink-0 text-rose-400" />
            <div className="flex-1">
              <span className="block font-bold text-rose-200">
                Attention Required:
              </span>
              <span>{formError}</span>
            </div>
          </div>
        )}

        {/* MOBILE & TABLET LAYOUT: Horizontally scrollable section tabs (< xl) */}
        <div className="xl:hidden w-full overflow-x-auto whitespace-nowrap scrollbar-none pb-2 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 p-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isPassed =
                SECTIONS.findIndex((s) => s.id === section.id) < currentIndex;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setActiveSection(section.id);
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-cyan-400/40"
                      : isPassed
                        ? "bg-slate-900 text-cyan-300 ring-1 ring-slate-800"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                      isActive
                        ? "bg-white text-blue-600"
                        : isPassed
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isPassed ? <Check size={11} /> : section.number}
                  </span>
                  <Icon
                    size={13}
                    className="shrink-0 opacity-80 hidden sm:block"
                  />
                  <span>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DESKTOP LAYOUT (xl widths): grid-template-columns: 220px 1fr, gap: 28px */}
        <div className="grid xl:grid-cols-[220px_1fr] gap-7 items-start">
          {/* DESKTOP STICKY SECTION-NAVIGATION CARD */}
          <aside className="hidden xl:block sticky top-24 self-start rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-2">
              Form Sections
            </div>
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isPassed =
                SECTIONS.findIndex((s) => s.id === section.id) < currentIndex;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setActiveSection(section.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-cyan-400/40"
                      : isPassed
                        ? "text-cyan-300 hover:bg-slate-800/80"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                      isActive
                        ? "bg-white text-blue-600"
                        : isPassed
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isPassed ? <Check size={13} /> : section.number}
                  </div>
                  <Icon size={14} className="shrink-0 opacity-80" />
                  <span className="truncate">{section.title}</span>
                </button>
              );
            })}
          </aside>

          {/* MAIN FORM CONTENT (Full Width within column) */}
          <main className="w-full space-y-6">
            {/* SECTION 1: Basic information */}
            {activeSection === "basic" && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md space-y-7 animate-in fade-in">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Section 1 of 7
                  </span>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                    <Building2 size={22} className="text-blue-400" />
                    Basic information
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Provide the host organization, brand logo, title, category,
                    and location.
                  </p>
                </div>

                {/* Organization logo upload */}
                <div
                  id="field-logo"
                  className={`rounded-2xl border p-5 sm:p-6 transition-all space-y-4 ${
                    activeErrorField === "field-logo"
                      ? "border-2 border-rose-500 ring-4 ring-rose-500/25 bg-rose-500/5"
                      : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon size={18} className="text-cyan-400" />
                      Organization Logo <span className="text-rose-400">*</span>
                    </label>
                    {croppedPreview || originalImage ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                        <CheckCircle2 size={13} />
                        Logo Uploaded & Cropped
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400/90 font-medium">
                        Required for publish (PNG, JPG, SVG, WebP)
                      </span>
                    )}
                  </div>

                  {/* Drag and Drop Zone / Controls */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all flex flex-col items-center justify-center gap-3 ${
                      isDragOver
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoFile(file);
                        e.target.value = "";
                      }}
                    />

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400">
                      <Upload size={22} />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4"
                      >
                        Click to upload
                      </button>
                      <span className="text-xs text-slate-400 ml-1.5">
                        or drag and drop logo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Supports PNG, JPG/JPEG, SVG, and WebP (1:1 Square Crop)
                    </p>

                    {/* Button Controls: Replace, Edit crop, Remove */}
                    {(croppedPreview || originalImage) && (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-800/80 w-full">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          <Upload size={13} />
                          <span>Replace Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCropModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60"
                        >
                          <Crop size={13} />
                          <span>Edit Crop</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Multi-Size Previews (40x40, 64x64, 32x32) */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Live Image Previews
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                        <CroppedLogoPreview
                          src={croppedPreview || originalImage}
                          crop={savedCrop}
                          size="card"
                        />
                        <span className="text-[11px] font-medium text-slate-300">
                          Opportunity card
                        </span>
                        <span className="text-[10px] text-slate-500">
                          40×40
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                        <CroppedLogoPreview
                          src={croppedPreview || originalImage}
                          crop={savedCrop}
                          size="detail"
                        />
                        <span className="text-[11px] font-medium text-slate-300">
                          Detail page
                        </span>
                        <span className="text-[10px] text-slate-500">
                          64×64
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                        <CroppedLogoPreview
                          src={croppedPreview || originalImage}
                          crop={savedCrop}
                          size="table"
                        />
                        <span className="text-[11px] font-medium text-slate-300">
                          Admin table row
                        </span>
                        <span className="text-[10px] text-slate-500">
                          32×32
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields: Title, Organization, Category, Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-200">
                      Opportunity Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="field-title"
                      type="text"
                      placeholder="e.g. Generation Google Scholarship 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full rounded-2xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                        activeErrorField === "field-title"
                          ? "border-2 border-rose-500 ring-4 ring-rose-500/25 bg-rose-500/5"
                          : "border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Organization <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="field-organization"
                      type="text"
                      placeholder="e.g. Google LLC, Microsoft, NASA"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className={`w-full rounded-2xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                        activeErrorField === "field-organization"
                          ? "border-2 border-rose-500 ring-4 ring-rose-500/25 bg-rose-500/5"
                          : "border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none capitalize"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Remote, Hybrid, Mountain View, CA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Organization Type
                    </label>
                    <select
                      value={organizationType}
                      onChange={(e) => setOrganizationType(e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none capitalize"
                    >
                      {ORG_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Target Education Level{" "}
                      <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={educationLevel}
                      onChange={(e: any) => setEducationLevel(e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none capitalize"
                    >
                      <option value="undergraduate">Undergraduate</option>
                      <option value="postgraduate">Postgraduate</option>
                      <option value="high-school">High School</option>
                      <option value="diploma">Diploma</option>
                      <option value="phd">PhD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: Opportunity details (Single textarea named Opportunity description) */}
            {activeSection === "details" && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Section 2 of 7
                  </span>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                    <FileText size={22} className="text-blue-400" />
                    Opportunity details
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Provide a comprehensive overview of the program,
                    expectations, and curriculum.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200">
                    Opportunity description
                  </label>
                  <textarea
                    rows={9}
                    placeholder="Enter comprehensive opportunity details here...&#10;&#10;Pressing Enter creates a new line. Line breaks will be preserved when displayed to students."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y leading-relaxed font-sans"
                  />
                  <p className="text-[11px] text-slate-500">
                    Approximately 9 visible rows, resizable vertically.
                    Formatted with line breaks preserved.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 3: Eligibility */}
            {activeSection === "eligibility" && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Section 3 of 7
                  </span>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                    <Sparkles size={22} className="text-blue-400" />
                    Eligibility
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Define eligibility requirements and summary for applicant
                    verification.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Eligibility summary
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Open to enrolled undergraduate computer science students worldwide"
                    value={eligibilitySummary}
                    onChange={(e) => setEligibilitySummary(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Requirements List + Add/Remove Controls */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-200">
                    Eligibility requirements list
                  </label>

                  <div className="space-y-2">
                    {eligibilityList.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3.5 text-xs text-slate-500 italic">
                        No requirements added yet. Type a requirement below and
                        click &quot;Add Requirement&quot;.
                      </div>
                    ) : (
                      eligibilityList.map((req, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2.5 text-xs text-slate-200"
                        >
                          <span className="flex-1 leading-relaxed">
                            • {req}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRequirement(idx)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                            title="Remove requirement"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add a new requirement (e.g. Minimum 3.5 cumulative GPA)..."
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddRequirement();
                        }
                      }}
                      className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white"
                    >
                      <Plus size={14} />
                      <span>Add Requirement</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: Benefits */}
            {activeSection === "benefits" && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Section 4 of 7
                  </span>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                    <Gift size={22} className="text-blue-400" />
                    Benefits
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Outline stipends, educational grants, mentorship, or
                    certificates provided.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Benefit summary
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $10,000 USD Stipend + 1-on-1 Mentorship + Travel Grant"
                    value={benefitsSummary}
                    onChange={(e) => setBenefitsSummary(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Benefits List + Add/Remove Controls */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-200">
                    Benefits list
                  </label>

                  <div className="space-y-2">
                    {benefitsList.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3.5 text-xs text-slate-500 italic">
                        No benefits added yet. Type a benefit below and click
                        &quot;Add Benefit&quot;.
                      </div>
                    ) : (
                      benefitsList.map((ben, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2.5 text-xs text-slate-200"
                        >
                          <span className="flex-1 leading-relaxed">
                            • {ben}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBenefit(idx)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                            title="Remove benefit"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add a new benefit (e.g. Invitation to Summer Gala in NYC)..."
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddBenefit();
                        }
                      }}
                      className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddBenefit}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white"
                    >
                      <Plus size={14} />
                      <span>Add Benefit</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: Required documents (Interactive list matching Benefits) */}
            {activeSection === "documents" && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Section 5 of 7
                  </span>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                    <FileCheck2 size={22} className="text-blue-400" />
                    Required documents
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Specify all required documents applicants must prepare and
                    submit.
                  </p>
                </div>

                {/* Documents List + Add/Remove Controls (Exact same pattern as Benefits) */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-200">
                    Required documents list
                  </label>

                  <div className="space-y-2">
                    {documentsList.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3.5 text-xs text-slate-500 italic">
                        No required documents added yet. Type a document name
                        below and click &quot;Add Document&quot;.
                      </div>
                    ) : (
                      documentsList.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2.5 text-xs text-slate-200"
                        >
                          <span className="flex-1 leading-relaxed">
                            • {doc}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(idx)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                            title="Remove document"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add a required document (e.g. Official University Transcript)..."
                      value={newDocument}
                      onChange={(e) => setNewDocument(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDocument();
                        }
                      }}
                      className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white"
                    >
                      <Plus size={14} />
                      <span>Add Document</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 6: Important dates (Only Start Date & Application Deadline) */}
            {activeSection === "dates" && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Section 6 of 7
                  </span>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                    <Calendar size={22} className="text-blue-400" />
                    Important dates
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Specify the program start date and application deadline.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Opportunity start date
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD or e.g. June 15, 2026"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950 pl-4 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
                      />
                      <div className="absolute right-3 flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors">
                        <Calendar size={16} className="pointer-events-none" />
                        <input
                          type="date"
                          tabIndex={-1}
                          onChange={(e) => {
                            if (e.target.value) {
                              setStartDate(e.target.value);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          title="Click to open calendar"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Application deadline{" "}
                      <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="field-deadline"
                        type="text"
                        placeholder="YYYY-MM-DD or e.g. May 30, 2026"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className={`w-full rounded-2xl border bg-slate-950 pl-4 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                          activeErrorField === "field-deadline"
                            ? "border-2 border-rose-500 ring-4 ring-rose-500/25 bg-rose-500/5"
                            : "border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        }`}
                      />
                      <div className="absolute right-3 flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors">
                        <Calendar size={16} className="pointer-events-none" />
                        <input
                          type="date"
                          tabIndex={-1}
                          onChange={(e) => {
                            if (e.target.value) {
                              setDeadline(e.target.value);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          title="Click to open calendar"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Required for publishing this listing to students.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 7: Links (FINAL SECTION) */}
            {activeSection === "links" && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md space-y-7 animate-in fade-in">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Section 7 of 7 — Final Section
                  </span>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                    <LinkIcon size={22} className="text-blue-400" />
                    Links
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Official source and destination URLs where students apply.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Official website URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://buildyourfuture.withgoogle.com/..."
                      value={officialSourceUrl}
                      onChange={(e) => setOfficialSourceUrl(e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Application URL <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="field-applicationUrl"
                      type="url"
                      placeholder="https://careers.google.com/jobs/..."
                      value={applicationUrl}
                      onChange={(e) => setApplicationUrl(e.target.value)}
                      className={`w-full rounded-2xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                        activeErrorField === "field-applicationUrl"
                          ? "border-2 border-rose-500 ring-4 ring-rose-500/25 bg-rose-500/5"
                          : "border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      }`}
                    />
                    <p className="text-[11px] text-slate-500">
                      Required. Students clicking &apos;Apply Now&apos; will be
                      directed to this destination URL.
                    </p>
                  </div>
                </div>

                {/* FINAL ACTION AREA: Displayed ONLY when active section is Links.
                    Features both "Save as Draft" and "Save & Publish". */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handlePrevSection}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={16} />
                    <span>Previous: Important dates</span>
                  </button>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSaveAction("draft")}
                      disabled={isPublishing}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <Save size={16} />
                      <span>Save as Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveAction("published")}
                      disabled={isPublishing}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-blue-600 px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all"
                    >
                      <CheckCircle2 size={18} />
                      <span>
                        {isPublishing ? "Publishing..." : "Save & Publish"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* INTERMEDIATE STEPPER BUTTONS (Sections 1 through 6) */}
            {activeSection !== "links" && (
              <div className="flex items-center justify-between border-t border-white/10 pt-5">
                {currentIndex > 0 ? (
                  <button
                    type="button"
                    onClick={handlePrevSection}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={15} />
                    <span>Previous Section</span>
                  </button>
                ) : (
                  <Link
                    to="/admin/opportunities"
                    className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel & Exit
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleNextSection}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all"
                >
                  <span>Continue to {SECTIONS[currentIndex + 1].title}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </main>
        </div>

        {/* 1:1 Square Cropper Modal (Restores exact crop and exports normalized metadata) */}
        {cropModalOpen && originalImage && (
          <LogoCropModal
            isOpen={cropModalOpen}
            imageSrc={originalImage}
            initialCrop={savedCrop}
            onClose={() => setCropModalOpen(false)}
            onSave={handleCropSave}
          />
        )}
      </div>
    </AdminLayout>
  );
}

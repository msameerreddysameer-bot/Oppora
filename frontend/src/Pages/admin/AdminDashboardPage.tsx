import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InfiniteScroll from 'react-infinite-scroll-component'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  FlaskConical,
  GitBranch,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Terminal,
  Trash2,
  Trophy,
  UploadCloud,
  X,
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import OrganizationLogo from '@/components/shared/OrganizationLogo'
import { type IOpportunity, type PublicationStatus } from '@/demo/studentDemoData'
import {
  apiDeleteOpportunity,
  apiEditOpportunity,
  apiGetOpportunityStats,
  apiSearchOpportunities,
  type IOpportunityStatsData,
} from '@/services/opportunityService'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  // =========================================================================
  // STATE MANAGEMENT: STATS & RECENTLY ADDED OPPORTUNITIES
  // =========================================================================
  const [stats, setStats] = useState<IOpportunityStatsData | null>(null)
  const [opportunities, setOpportunities] = useState<IOpportunity[]>(() => {
    try {
      const saved = localStorage.getItem('admin_managed_opportunities')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (o) => !['opp-101', 'opp-102', 'opp-103', 'opp-104'].includes(o._id)
          )
        }
      }
    } catch {
      // fallback
    }
    return []
  })

  // Pagination & Infinite Scroll States for Recently Added Table (Limit: 50)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalOpportunitiesCount, setTotalOpportunitiesCount] = useState(0)

  const [isLoading, setIsLoading] = useState(false)

  // Modal & Feedback States
  const [opportunityToPublish, setOpportunityToPublish] = useState<IOpportunity | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [opportunityToDelete, setOpportunityToDelete] = useState<IOpportunity | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedbackToast, setFeedbackToast] = useState<{
    type: 'success' | 'error'
    title: string
    message: string
  } | null>(null)

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (!feedbackToast) return
    const timer = setTimeout(() => {
      setFeedbackToast(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [feedbackToast])

  const saveToStorage = (updated: IOpportunity[]) => {
    setOpportunities(updated)
    localStorage.setItem('admin_managed_opportunities', JSON.stringify(updated))
  }

  // =========================================================================
  // [BACKEND API: FETCH DASHBOARD STATS & RECENT OPPORTUNITIES (PAGE 1, LIMIT: 50)]
  // =========================================================================
  const fetchDashboardData = async () => {
    setIsLoading(true)

    // 1. Fetch exact aggregate stats from /opportunity/stats
    try {
      const statsRes = await apiGetOpportunityStats()
      const payload: IOpportunityStatsData | undefined =
        statsRes?.data?.totalOpportunities !== undefined
          ? statsRes.data
          : statsRes?.totalOpportunities !== undefined
          ? (statsRes as any)
          : statsRes?.data

      if (payload) {
        setStats(payload)
      }
    } catch (err) {
      console.info('[Admin Dashboard] Error fetching opportunity stats:', err)
    }

    // 2. Fetch recently added opportunities for the table (Page 1, Limit 50)
    try {
      const res = await apiSearchOpportunities({ page: 1, limit: 50 })
      const liveList =
        res?.data?.opportunities || res?.opportunities || res?.data || []
      const total =
        res?.data?.totalResults ??
        res?.data?.total ??
        res?.totalResults ??
        res?.total ??
        (Array.isArray(liveList) ? liveList.length : 0)

      if (Array.isArray(liveList) && liveList.length > 0) {
        setOpportunities(liveList)
        setTotalOpportunitiesCount(total)
        setPage(1)
        setHasMore(liveList.length < total)
        localStorage.setItem('admin_managed_opportunities', JSON.stringify(liveList))
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.info(
        '[Admin Dashboard] Backend API search unreachable, using cached opportunities:',
        err
      )
    } finally {
      setIsLoading(false)
    }
  }

  // =========================================================================
  // [INFINITE SCROLL: FETCH MORE RECENT OPPORTUNITIES (NEXT PAGE, LIMIT: 50)]
  // =========================================================================
  const fetchMoreLiveOpportunities = async () => {
    if (isLoadingMore || !hasMore) return
    const nextPage = page + 1
    setIsLoadingMore(true)

    try {
      console.log(`[Admin Dashboard] Fetching page ${nextPage} of opportunities (limit 50)...`)
      const res = await apiSearchOpportunities({ page: nextPage, limit: 50 })
      const backendList =
        res?.data?.opportunities || res?.opportunities || res?.data || []
      const total =
        res?.data?.totalResults ??
        res?.data?.total ??
        res?.totalResults ??
        res?.total ??
        totalOpportunitiesCount

      if (Array.isArray(backendList) && backendList.length > 0) {
        let reachedEnd = false
        setOpportunities((prev) => {
          const existingIds = new Set(prev.map((o) => o._id))
          const newItems = backendList.filter((o: any) => !existingIds.has(o._id))
          const combined = [...prev, ...newItems]
          if (combined.length >= total || newItems.length === 0 || backendList.length < 50) {
            reachedEnd = true
          }
          return combined
        })
        setPage(nextPage)
        setTotalOpportunitiesCount(total)
        if (reachedEnd) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.warn('[Admin Dashboard] Error loading more opportunities:', err)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // =========================================================================
  // [REAL-TIME AUTO-UPDATE VIA USE EFFECT]
  // 1. Initial fetch on mount
  // 2. Background polling every 20 seconds
  // 3. Reacts instantly to 'opportunity-updated' custom events
  // 4. Reacts to browser window focus & tab visibility
  // =========================================================================
  useEffect(() => {
    let isMounted = true

    // Initial load
    fetchDashboardData()

    // 1. Background Polling Interval: 20 seconds
    const intervalId = setInterval(() => {
      if (isMounted) {
        fetchDashboardData()
      }
    }, 20000)

    // 2. Custom Window Event: Dispatched whenever an opportunity is created/edited/deleted
    const handleOpportunityChange = () => {
      if (isMounted) {
        console.log('[Admin Dashboard] Opportunity change detected. Auto-refreshing metrics...')
        fetchDashboardData()
      }
    }
    window.addEventListener('opportunity-updated', handleOpportunityChange)
    window.addEventListener('storage', handleOpportunityChange)

    // 3. Window Focus: Updates immediately when returning to the tab
    const handleWindowFocus = () => {
      if (isMounted) {
        fetchDashboardData()
      }
    }
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      isMounted = false
      clearInterval(intervalId)
      window.removeEventListener('opportunity-updated', handleOpportunityChange)
      window.removeEventListener('storage', handleOpportunityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [])

  // =========================================================================
  // [CONFIRM & PUBLISH DRAFT OPPORTUNITY]
  // Hits PATCH /opportunity/:id via opportunityService.apiEditOpportunity()
  // Once published, cannot again run back to draft!
  // =========================================================================
  const handleConfirmPublish = async () => {
    if (!opportunityToPublish) return
    const targetId = opportunityToPublish._id
    const targetTitle = opportunityToPublish.title

    setIsPublishing(true)

    try {
      // 1. Call Backend API to update status to active and publicationStatus to published
      await apiEditOpportunity(targetId, {
        status: 'active',
        publicationStatus: 'published',
      })

      // 2. Optimistic & Local Storage update
      const updated = opportunities.map((o) => {
        if (o._id === targetId) {
          return {
            ...o,
            publicationStatus: 'published' as PublicationStatus,
            status: 'active',
            updatedAt: new Date().toISOString(),
          } as IOpportunity
        }
        return o
      })
      saveToStorage(updated)

      // 3. Display success alert message in the frontend
      setFeedbackToast({
        type: 'success',
        title: 'Opportunity Published Successfully!',
        message: `"${targetTitle}" is now live and visible to students in the directory.`,
      })

      // 4. Close the confirmation modal
      setOpportunityToPublish(null)

      // 5. Trigger background stats update immediately
      fetchDashboardData()
    } catch (err: any) {
      console.error('[API Error] Could not publish opportunity:', err)
      setFeedbackToast({
        type: 'error',
        title: 'Publish Failed',
        message:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to publish opportunity. Please check backend connection and try again.',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // =========================================================================
  // [DELETE OPPORTUNITY]
  // =========================================================================
  const handleConfirmDelete = async () => {
    if (!opportunityToDelete) return
    const targetId = opportunityToDelete._id
    const targetTitle = opportunityToDelete.title

    setIsDeleting(true)

    try {
      await apiDeleteOpportunity(targetId)
      const updated = opportunities.filter((o) => o._id !== targetId)
      saveToStorage(updated)

      setFeedbackToast({
        type: 'success',
        title: 'Opportunity Deleted',
        message: `"${targetTitle}" has been permanently removed.`,
      })
      setOpportunityToDelete(null)
      fetchDashboardData()
    } catch (err: any) {
      console.warn('[API Warning] Could not delete opportunity on backend:', err)
      setFeedbackToast({
        type: 'error',
        title: 'Delete Failed',
        message:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to delete opportunity.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // =========================================================================
  // [METRICS COMPUTATION: EXACT STATS FROM API WITH RESILIENT FALLBACK]
  // =========================================================================
  const getCategoryMetrics = (catKey: string) => {
    // 1. Priority: Exact aggregate metrics from backend GET /opportunity/stats
    if (stats?.categories && Array.isArray(stats.categories)) {
      const cleaned = catKey.toLowerCase().replace(/[-_\s]/g, '')
      const match = stats.categories.find((c) => {
        const dbName = (c.category || '').toLowerCase().replace(/[-_\s]/g, '')
        return dbName === cleaned || dbName.includes(cleaned) || cleaned.includes(dbName)
      })

      if (match) {
        const total = match.total ?? 0
        const live = match.live ?? 0
        const active = match.active ?? 0
        const expired = Math.max(0, total - live)
        return { total, live, active, expired }
      }
    }

    // 2. Client-side fallback: Computed across opportunities list
    const filtered = opportunities.filter((o) =>
      (o.category || '').toLowerCase().includes(catKey.toLowerCase())
    )
    const total = filtered.length
    const live = filtered.filter(
      (o) =>
        (o.publicationStatus === 'published' || o.status === 'active') &&
        o.publicationStatus !== 'draft'
    ).length
    const expired = Math.max(0, total - live)
    return { total, live, active: live, expired }
  }

  // Aggregate Top Counts
  const overallTotal = stats?.totalOpportunities ?? (totalOpportunitiesCount > 0 ? totalOpportunitiesCount : opportunities.length)
  const overallLive =
    stats?.totalLive ??
    opportunities.filter(
      (o) =>
        (o.publicationStatus === 'published' || o.status === 'active') &&
        o.publicationStatus !== 'draft'
    ).length
  const overallExpired = stats?.totalExpired ?? Math.max(0, overallTotal - overallLive)
  const overallActive = stats?.totalActive ?? overallLive

  // Category-specific metrics
  const scholarshipMetrics = getCategoryMetrics('scholarship')
  const fellowshipMetrics = getCategoryMetrics('fellowship')
  const internshipMetrics = getCategoryMetrics('internship') // Matches 'intership' & 'internship'
  const hackathonMetrics = getCategoryMetrics('hackathon')
  const openSourceMetrics = getCategoryMetrics('open-source')
  const researchMetrics = getCategoryMetrics('research')
  const competitionMetrics = getCategoryMetrics('competition')
  const workshopMetrics = getCategoryMetrics('workshop')

  // Top Summary & Category Cards Configuration
  const summaryCards = [
    {
      id: 'total',
      label: 'Total opportunities',
      count: overallTotal,
      live: overallLive,
      expired: overallExpired,
      active: overallActive,
      sublabel: 'All cataloged listings',
      icon: Briefcase,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      id: 'scholarships',
      label: 'Scholarships',
      count: scholarshipMetrics.total,
      live: scholarshipMetrics.live,
      expired: scholarshipMetrics.expired,
      active: scholarshipMetrics.active,
      sublabel: 'Funding & grant programs',
      icon: GraduationCap,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      highlight: true, // Special styling for user's requested focus card
    },
    {
      id: 'fellowships',
      label: 'Fellowships',
      count: fellowshipMetrics.total,
      live: fellowshipMetrics.live,
      expired: fellowshipMetrics.expired,
      active: fellowshipMetrics.active,
      sublabel: 'Academic & leadership',
      icon: Sparkles,
      color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      id: 'internships',
      label: 'Internships',
      count: internshipMetrics.total,
      live: internshipMetrics.live,
      expired: internshipMetrics.expired,
      active: internshipMetrics.active,
      sublabel: 'Industry & work programs',
      icon: Building2,
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    },
    {
      id: 'hackathons',
      label: 'Hackathons',
      count: hackathonMetrics.total,
      live: hackathonMetrics.live,
      expired: hackathonMetrics.expired,
      active: hackathonMetrics.active,
      sublabel: 'Coding & build events',
      icon: Terminal,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'opensource',
      label: 'Open source',
      count: openSourceMetrics.total,
      live: openSourceMetrics.live,
      expired: openSourceMetrics.expired,
      active: openSourceMetrics.active,
      sublabel: 'Contributor programs',
      icon: GitBranch,
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'research',
      label: 'Research',
      count: researchMetrics.total,
      live: researchMetrics.live,
      expired: researchMetrics.expired,
      active: researchMetrics.active,
      sublabel: 'Labs & research grants',
      icon: FlaskConical,
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    },
    {
      id: 'competitions',
      label: 'Competitions',
      count: competitionMetrics.total,
      live: competitionMetrics.live,
      expired: competitionMetrics.expired,
      active: competitionMetrics.active,
      sublabel: 'Contests & challenges',
      icon: Trophy,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    {
      id: 'live',
      label: 'Live / Open',
      count: overallLive,
      live: overallLive,
      expired: overallExpired,
      active: overallActive,
      sublabel: 'Active & published',
      icon: CheckCircle2,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'workshops',
      label: 'Workshops',
      count: workshopMetrics.total,
      live: workshopMetrics.live,
      expired: workshopMetrics.expired,
      active: workshopMetrics.active,
      sublabel: 'Hands-on learning & bootcamps',
      icon: Layers,
      color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    },
  ]

     const convertIsoDateToNormalDate = (IsoString?: string) => {
        if (!IsoString) return '—'
        try {
          const date = new Date(IsoString)
          if (isNaN(date.getTime())) return IsoString
          return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Kolkata',
          }).format(date).replace(/\//g, '-')
        } catch {
          return IsoString
        }
     }

  return (
    <AdminLayout activeTab="dashboard">
      <div className="space-y-7 max-w-7xl mx-auto">
        {/* Header with Real-time Sync Indicator & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                {/* <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Live Synchronized */}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Opportunity database overview & real-time metrics (automatically updates when listings are added)
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Quick Refresh Button */}
            {/* <button
              type="button"
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all active:scale-95 disabled:opacity-50"
              title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
            >
              <RotateCw size={14} className={isLoading ? 'animate-spin text-cyan-400' : ''} />
            <span>{isLoading ? 'Updating...' : 'Sync Now'}</span>
            </button> */}

            <Link
              to="/admin/create-opportunity"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95 shrink-0"
            >
              <Plus size={16} />
              <span>Create opportunity</span>
            </Link>
          </div>
        </div>

        {/* Unified Top Summary & Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.id}
                className={`group relative flex flex-col justify-between rounded-2xl border transition-all p-4 sm:p-5 shadow-sm hover:shadow-md ${
                  card.highlight
                    ? 'border-indigo-500/40 bg-linear-to-b from-indigo-950/20 to-slate-900/90 dark:bg-linear-to-b dark:from-indigo-950/40 dark:to-slate-900 ring-1 ring-indigo-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-700/80'
                }`}
              >
                <div>
                  {/* Top: Category Label & Icon */}
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate mr-1">
                      {card.label}
                    </span>
                    <div
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg shrink-0 ${card.color}`}
                    >
                      <Icon size={16} />
                    </div>
                  </div>

                  {/* Total Number in Prominent Large Font */}
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {card.count}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {card.sublabel}
                  </div>
                </div>

                {/* Professional Breakdown: Live & Expired Pills in Small Letters */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2.5 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                    title={`${card.live} live opportunities`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    {card.live} Live
                  </span>

                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 font-semibold text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20"
                    title={`${card.expired} expired opportunities`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                    {card.expired} Expired
                  </span>

                  {card.active !== undefined && card.active > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5 font-semibold text-blue-600 dark:text-cyan-300 ring-1 ring-blue-500/20 ml-auto"
                      title={`${card.active} active opportunities`}
                    >
                      {card.active} Open
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Recently Added Table with Infinite Scroll (50 per batch) */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Recently Added
                </h2>
                {/* <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-cyan-300">
                  {totalOpportunitiesCount > 0 ? totalOpportunitiesCount : opportunities.length}
                </span> */}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Latest opportunities 
              </p>
            </div>
            {opportunities.length > 0 && (
              <Link
                to="/admin/opportunities"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 transition-colors"
              >
                <span>View all in directory</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {isLoading && opportunities.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-medium text-cyan-300 shadow">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                <span>Loading opportunities...</span>
              </div>
            </div>
          ) : opportunities.length === 0 ? (
            /* Clean Empty State when no real data exists */
            <div className="py-12 text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                <Briefcase size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  No opportunities cataloged yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Get started by creating your first opportunity or sync with your backend database.
                </p>
              </div>
              <Link
                to="/admin/create-opportunity"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-500 transition-colors"
              >
                <Plus size={15} />
                <span>Create Opportunity</span>
              </Link>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={opportunities.length}
              next={fetchMoreLiveOpportunities}
              hasMore={hasMore}
              scrollThreshold={0.8}
              loader={
                <div className="flex items-center justify-center py-6">
                  <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-medium text-cyan-300 shadow backdrop-blur-sm">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    <span>Loading more opportunities...</span>
                  </div>
                </div>
              }
              endMessage={
                opportunities.length > 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    ✨ All {totalOpportunitiesCount > 0 ? totalOpportunitiesCount : opportunities.length} recently added opportunities loaded
                  </div>
                ) : null
              }
            >
              {/* Responsive Desktop Table */}
              <div className="hidden md:block relative overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-950/60 shadow-inner scrollbar-thin scrollbar-thumb-slate-700">
                <table className="w-full text-left text-xs min-w-[780px] border-collapse">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-slate-900/95 uppercase tracking-wider text-slate-400 text-[11px] backdrop-blur-md">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Opportunity</th>
                      <th className="py-3.5 px-3 font-semibold">Category</th>
                      <th className="py-3.5 px-3 font-semibold">Status</th>
                      <th className="py-3.5 px-3 font-semibold">Deadline</th>
                      <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {opportunities.map((opp) => {
                      const isPublished =
                        opp.publicationStatus === 'published' ||
                        (opp.status === 'active' && opp.publicationStatus !== 'draft')

                      return (
                        <tr
                          key={opp._id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Organization logo, Organization name, Opportunity title */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <OrganizationLogo
                                src={opp.originalLogo || opp.organizationLogo}
                                crop={opp.logoCrop}
                                size="card"
                                organization={opp.organization}
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-xs sm:max-w-md group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                                  {opp.title}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                  {opp.organization}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="inline-block rounded-md bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-cyan-300 ring-1 ring-blue-500/20 px-2.5 py-1 text-[11px] font-semibold capitalize">
                              {opp.category}
                            </span>
                          </td>

                          {/* Publication Status Badge */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {isPublished ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400 ring-1 ring-amber-500/20">
                                <Clock size={11} />
                                Draft
                              </span>
                            )}
                          </td>

                          {/* Deadline */}
                          <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{convertIsoDateToNormalDate(opp.deadline)}</span>
                            </div>
                          </td>

                          {/* Action Menu: Exactly like in Opportunities Page */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {/* 1. Publish Button (ONLY shown for drafts; once published, cannot run back to draft) */}
                              {!isPublished && (
                                <button
                                  type="button"
                                  onClick={() => setOpportunityToPublish(opp)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-300 transition-all shadow-sm shadow-emerald-950/20 active:scale-95"
                                  title="Publish Opportunity (Live for Students)"
                                >
                                  <UploadCloud size={13} />
                                  <span>Publish</span>
                                </button>
                              )}

                              {/* 2. Edit Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/admin/opportunities/edit/${opp._id}`)
                                }
                                className="rounded-lg border border-slate-700/60 bg-slate-800/80 p-2 text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition-colors"
                                title="Edit opportunity"
                              >
                                <Edit2 size={13} />
                              </button>

                              {/* 3. Delete Button */}
                              <button
                                type="button"
                                onClick={() => setOpportunityToDelete(opp)}
                                className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/20 transition-colors"
                                title="Delete opportunity"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Responsive Mobile Cards for screens < md */}
              <div className="md:hidden space-y-3.5">
                {opportunities.map((opp) => {
                  const isPublished =
                    opp.publicationStatus === 'published' ||
                    (opp.status === 'active' && opp.publicationStatus !== 'draft')

                  return (
                    <div
                      key={opp._id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <OrganizationLogo
                            src={opp.originalLogo || opp.organizationLogo}
                            crop={opp.logoCrop}
                            size="card"
                            organization={opp.organization}
                          />
                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-sm leading-tight truncate">
                              {opp.title}
                            </h3>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {opp.organization}
                            </p>
                          </div>
                        </div>

                        {isPublished ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
                            Published
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/20 shrink-0">
                            Draft
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                        <span className="inline-block rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 capitalize">
                          {opp.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar size={12} />
                          <span>{convertIsoDateToNormalDate(opp.deadline)}</span>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        {!isPublished && (
                          <button
                            type="button"
                            onClick={() => setOpportunityToPublish(opp)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
                          >
                            <UploadCloud size={14} />
                            <span>Publish</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/opportunities/edit/${opp._id}`)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 py-2 text-xs font-semibold text-slate-200 transition-all"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpportunityToDelete(opp)}
                          className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-all"
                          title="Delete opportunity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </InfiniteScroll>
          )}
        </div>

        {/* =========================================================================
            PROFESSIONAL PUBLISH CONFIRMATION ALERT MODAL (Exactly as Opportunities page)
           ========================================================================= */}
        {opportunityToPublish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-emerald-950/20 space-y-5">
              {/* Header Icon & Question */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Publish Opportunity?
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Do you want to publish it? This will immediately make it active and visible to all students in the opportunity directory. Once published, it cannot be reverted back to draft.
                  </p>
                </div>
              </div>

              {/* Target Opportunity Preview Card */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 flex items-center gap-3">
                <OrganizationLogo
                  src={opportunityToPublish.organizationLogo}
                  originalSrc={opportunityToPublish.originalLogo}
                  crop={opportunityToPublish.logoCrop}
                  organization={opportunityToPublish.organization}
                  size="card"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {opportunityToPublish.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="truncate">{opportunityToPublish.organization}</span>
                    <span>•</span>
                    <span className="capitalize text-cyan-400 font-medium">
                      {opportunityToPublish.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={() => setOpportunityToPublish(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handleConfirmPublish}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>Yes, Publish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PROFESSIONAL DELETE CONFIRMATION MODAL
           ========================================================================= */}
        {opportunityToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-rose-950/20 space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Delete Opportunity?
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Are you sure you want to delete this listing? This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 flex items-center gap-3">
                <OrganizationLogo
                  src={opportunityToDelete.organizationLogo}
                  originalSrc={opportunityToDelete.originalLogo}
                  crop={opportunityToDelete.logoCrop}
                  organization={opportunityToDelete.organization}
                  size="card"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {opportunityToDelete.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="truncate">{opportunityToDelete.organization}</span>
                    <span>•</span>
                    <span className="capitalize text-rose-400 font-medium">
                      {opportunityToDelete.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setOpportunityToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Delete Opportunity</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            FEEDBACK TOAST NOTIFICATION / ALERT MESSAGE
           ========================================================================= */}
        {feedbackToast && (
          <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-200">
            <div
              className={`rounded-2xl border p-4 shadow-2xl backdrop-blur-md flex items-start gap-3.5 ${
                feedbackToast.type === 'success'
                  ? 'border-emerald-500/30 bg-slate-900/95 text-white shadow-emerald-950/40 ring-1 ring-emerald-500/20'
                  : 'border-rose-500/30 bg-slate-900/95 text-white shadow-rose-950/40 ring-1 ring-rose-500/20'
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  feedbackToast.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {feedbackToast.type === 'success' ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-white">
                  {feedbackToast.title}
                </p>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {feedbackToast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackToast(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

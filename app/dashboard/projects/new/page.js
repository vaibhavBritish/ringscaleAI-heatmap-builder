'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, Loader2, MapPin, Check, Building2, Info, 
  Settings, ChevronDown, ChevronUp, Plus, X, 
  Target, Zap, CreditCard, RefreshCw, Layers, ChevronRight
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import Link from 'next/link'
import GoogleMap from '@/components/GoogleMap'
import { generateHeatmapGrid } from '@/lib/heatmap-utils'
import { calculateAnalytics } from '@/lib/grid-utils'

export default function NewProjectPage() {
  const { data: session } = useSession()
  const userPlan = session?.user?.plan || 'trial'
  
  const router = useRouter()
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [mapType, setMapType] = useState('roadmap')
  const [creating, setCreating] = useState(false)
  
  // Heatmap Settings
  const [gridShape, setGridShape] = useState('circle')
  const [gridDensity, setGridDensity] = useState(133)
  const [gridRadius, setGridRadius] = useState(1)
  const [gridUnit, setGridUnit] = useState('mi')
  const [keywords, setKeywords] = useState([])
  const [newKeyword, setNewKeyword] = useState('')
  const [source, setSource] = useState('google-maps')
  const [heatmapPins, setHeatmapPins] = useState([])
  
  // Scanning State
  const [scanning, setScanning] = useState(false)
  const [activeScanJobId, setActiveScanJobId] = useState(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanAnalytics, setScanAnalytics] = useState(null)
  
  // Auto-clamp radius when unit changes or session loads
  useEffect(() => {
    const getLimit = (plan) => {
      const p = (plan || 'trial')
        .toLowerCase()
        .replace('plan_', '')
        .replace(' ', '_')
        .replace('lite', 'advance')
        
      const limits = {
        'trial': 5,
        'advance': 5,
        'pro': 10,
        'pro_plus': 20
      }
      return limits[p] || 5
    }
    
    // Max radius is always defined in miles according to requirements
    const maxMiles = getLimit(userPlan)
    const max = gridUnit === 'mi' ? maxMiles : Math.round(maxMiles * 1.60934)
    
    if (gridRadius > max) {
      setGridRadius(max)
      toast.warning(`Radius restricted to ${max} ${gridUnit} for your ${userPlan.toLowerCase().includes('trial') ? 'Trial' : userPlan.replace('plan_', '').split('_').map(w => w.toUpperCase()).join(' ')} plan`, {
        description: `Your plan allows a maximum radius of ${maxMiles} miles.`,
        action: {
          label: "Plans",
          onClick: () => router.push('/dashboard/billing')
        }
      })
    }
  }, [gridUnit, userPlan, gridRadius])
  

  // UI State
  const [sidebarSections, setSidebarSections] = useState({
    business: true,
    source: true,
    settings: true
  })
  
  const [keywordSuggestions, setKeywordSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState(false)

  const searchParams = useSearchParams()
  const rescanJobId = searchParams.get('rescanJobId')
  const existingProjectId = searchParams.get('projectId')

  // Load existing project if provided
  useEffect(() => {
    if (existingProjectId) {
      fetchProjectDetails(existingProjectId)
    }
  }, [existingProjectId])

  const fetchProjectDetails = async (id) => {
    setSearching(true)
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (!response.ok) throw new Error('Failed to load project')
      
      const data = await response.json()
      const proj = data.project
      
      setSelectedBusiness({
        placeId: proj.placeId,
        businessName: proj.businessName,
        address: proj.address,
        latitude: proj.latitude,
        longitude: proj.longitude,
        primaryType: proj.primaryType
      })
      
      setSearchQuery(proj.businessName)
      
      if (proj.gridSettings) {
        setGridShape(proj.gridSettings.shape || 'circle')
        setGridDensity(proj.gridSettings.density || 133)
        setGridRadius(proj.gridSettings.radius || 1)
        setGridUnit(proj.gridSettings.unit || 'mi')
      }
      
      if (data.keywords) {
        setKeywords(data.keywords.map(k => k.keyword))
      }
      
      toast.success('Project details loaded')
    } catch (error) {
      console.error('Error loading project details:', error)
      toast.error('Failed to load project details')
    } finally {
      setSearching(false)
    }
  }

  // Generate grid when center or settings change (Debounced to save API calls/CPU)
  useEffect(() => {
    if (selectedBusiness && !scanning && !scanAnalytics) {
      const timer = setTimeout(() => {
        // Internal utility requires km
        const radiusInKm = gridUnit === 'mi' ? gridRadius * 1.60934 : gridRadius
        const pins = generateHeatmapGrid(
          { lat: selectedBusiness.latitude, lng: selectedBusiness.longitude },
          gridShape,
          gridDensity,
          radiusInKm
        )
        setHeatmapPins(pins)
      }, 300)

      return () => clearTimeout(timer)
    } else if (!selectedBusiness) {
      setHeatmapPins([])
    }
  }, [selectedBusiness, gridShape, gridDensity, gridRadius, gridUnit, scanning, scanAnalytics])

  // Handle rescan/observation from URL
  useEffect(() => {
    if (rescanJobId && !scanning && !activeScanJobId) {
      const fetchInitialScan = async () => {
        try {
          const response = await fetch(`/api/scans/${rescanJobId}/results`)
          if (!response.ok) throw new Error('Scan not found')
          const data = await response.json()
          
          if (data.project) {
            setSelectedBusiness({
              name: data.project.businessName,
              address: data.project.address,
              latitude: Number(data.project.latitude),
              longitude: Number(data.project.longitude),
              placeId: data.project.placeId || data.project.businessId
            })
            if (data.project.gridSettings) {
              setGridShape(data.project.gridSettings.shape || 'circle')
              setGridDensity(data.project.gridSettings.density || 133)
              setGridRadius(data.project.gridSettings.radius || 1)
            }
          }
          
          if (data.keyword) {
            setKeywords([data.keyword.keyword])
          }
          
          setActiveScanJobId(rescanJobId)
          setScanning(true)
          
          // Generate pins immediately
          const pins = generateHeatmapGrid(
            { lat: Number(data.project.latitude), lng: Number(data.project.longitude) },
            data.project.gridSettings?.shape || 'circle',
            data.project.gridSettings?.density || 133,
            data.project.gridSettings?.radius || 1
          )
          setHeatmapPins(pins)
          
        } catch (error) {
          console.error('Initial scan fetch error:', error)
          toast.error('Failed to load active scan')
        }
      }
      
      fetchInitialScan()
    }
  }, [rescanJobId, scanning, activeScanJobId])

  // Polling logic for scan results
  useEffect(() => {
    let pollInterval
    
    if (scanning && activeScanJobId) {
      pollInterval = setInterval(async () => {
        // Skip polling if tab is hidden to save API requests
        if (document.visibilityState !== 'visible') return

        try {
          const response = await fetch(`/api/scans/${activeScanJobId}/results?aggregate=true`)
          if (!response.ok) throw new Error('Failed to fetch results')
          
          const data = await response.json()
          
          // Use projectScans for aggregate progress if available
          const allScans = data.projectScans || [data.scanJob]
          const totalProcessed = allScans.reduce((sum, s) => sum + (s.processedPoints || 0), 0)
          const totalPoints = allScans.reduce((sum, s) => sum + (s.totalPoints || 0), 0)
          
          if (totalPoints > 0) {
            const progress = Math.min(100, Math.round((totalProcessed / totalPoints) * 100))
            setScanProgress(progress)
          }
          
          // Update pins with ranks - match by coordinates for robustness
          if (data.results && data.results.length > 0) {
            setHeatmapPins(prevPins => {
              return prevPins.map((pin) => {
                // Find a matching result by coordinates with a bit more tolerance 
                // for floating point differences between server and client
                const match = data.results.find(r => 
                  Math.abs(r.latitude - pin.latitude) < 0.0001 && 
                  Math.abs(r.longitude - pin.longitude) < 0.0001
                )
                
                if (match && (match.found || match.rank)) {
                  return { ...pin, rank: match.rank, found: match.found }
                }
                return pin
              })
            })
          }
          
          // Finish when all scans are terminal OR implicitly done by progress.
          const allDone = allScans.every((s) => {
            if (['completed', 'failed', 'cancelled'].includes(s.status)) return true
            const total = s.totalPoints || 0
            const processed = s.processedPoints || 0
            return total > 0 && processed >= total
          })
          
          if (allDone) {
            setScanning(false)
            clearInterval(pollInterval)
            
            const anyFailed = allScans.some(s => s.status === 'failed')
            const anyCancelled = allScans.some(s => s.status === 'cancelled')
            
            if (!anyFailed && !anyCancelled) {
              setScanProgress(100)
              toast.success('All scans completed!')
              if (data.results) {
                const analytics = calculateAnalytics(data.results)
                setScanAnalytics(analytics)
              }
            } else if (anyCancelled) {
              toast.success('Scans stopped')
            } else {
              toast.error('One or more scans failed')
            }
          }
        } catch (error) {
          console.error('Polling error:', error)
        }
      }, 8000)
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [scanning, activeScanJobId])

  const handleCancelScan = async () => {
    if (!activeScanJobId) return
    
    try {
      const response = await fetch(`/api/scans/${activeScanJobId}/cancel`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to cancel scan')
      
      setScanning(false)
      toast.success('Scan stopped')
    } catch (error) {
      toast.error('Failed to stop scan')
    }
  }

  const handleReset = () => {
    setScanning(false)
    setActiveScanJobId(null)
    setScanProgress(0)
    setScanAnalytics(null)
    setHeatmapPins([])
    // Optional: reset settings or keep them? User might want to tweak.
    // Keeping settings for better UX.
  }

  // Debounced search for autocomplete
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3 && !selectedBusiness) {
        handleSearch()
      } else if (searchQuery.length < 3) {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedBusiness])
  
  // Debounced keyword suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (newKeyword.trim().length >= 2) {
        setSuggestionLoading(true)
        try {
          const response = await fetch(`/api/google/keyword-suggestions?q=${encodeURIComponent(newKeyword)}`)
          const data = await response.json()
          setKeywordSuggestions(data.results || [])
          setShowSuggestions(true)
        } catch (error) {
          console.error('Suggestion error:', error)
        } finally {
          setSuggestionLoading(false)
        }
      } else {
        setKeywordSuggestions([])
        setShowSuggestions(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [newKeyword])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    // Don't clear results if we are just searching more specifically
    // setSearchResults([]) 

    try {
      const response = await fetch('/api/google/search-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setSearchResults(data.results || [])
      
      if (data.results?.length === 0) {
        toast.error('No businesses found')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search business')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectBusiness = (business) => {
    setSelectedBusiness(business)
    setSearchResults([])
    setSearchQuery(business.name)
  }

  const handleSelectSuggestion = (kw) => {
    if (!keywords.map(k => k.toLowerCase()).includes(kw.toLowerCase())) {
      setKeywords([...keywords, kw.toLowerCase()])
    }
    setNewKeyword('')
    setShowSuggestions(false)
  }

  const handleAddKeyword = (e) => {
    if (e) e.preventDefault()
    if (!newKeyword.trim()) return
    if (keywords.includes(newKeyword.trim().toLowerCase())) {
      setNewKeyword('')
      setShowSuggestions(false)
      return
    }
    setKeywords([...keywords, newKeyword.trim().toLowerCase()])
    setNewKeyword('')
    setShowSuggestions(false)
  }

  const removeKeyword = (kw) => {
    setKeywords(keywords.filter(k => k !== kw))
  }

  const parseCityFromAddress = (address = '') => {
    const parts = (address || '').split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length < 2) return ''
    return parts[parts.length - 3] || parts[1] || ''
  }

  const detectBusinessCategory = (business) => {
    const text = `${business?.name || ''} ${business?.primaryType || ''} ${(business?.types || []).join(' ')}`.toLowerCase()

    if (text.includes('jewel') || text.includes('jeweller') || text.includes('jewelry')) return 'jewelry'
    if (text.includes('dentist') || text.includes('dental')) return 'dental'
    if (text.includes('restaurant') || text.includes('cafe') || text.includes('food')) return 'restaurant'
    if (text.includes('salon') || text.includes('spa') || text.includes('beauty')) return 'beauty'

    return 'generic'
  }

  const buildServiceKeywords = (business, city) => {
    const category = detectBusinessCategory(business)
    const citySuffix = city ? ` in ${city.toLowerCase()}` : ''

    if (category === 'jewelry') {
      return [
        'gold jewellery near me',
        'silver jewellery near me',
        'diamond jewellery near me',
        'best gold jewellery near me',
        'best silver jewellery near me',
        'best diamond jewellery near me',
        `gold jewellery store${citySuffix}`,
        `silver jewellery store${citySuffix}`,
        `diamond jewellery store${citySuffix}`,
        `bridal jewellery${citySuffix}`,
      ]
    }

    // Generic fallback for non-jewelry businesses.
    const primaryTypeText = (business?.primaryType || '')
      .replace(/_/g, ' ')
      .trim()
      .toLowerCase()
    const service = primaryTypeText || 'local business'

    return [
      `${service} near me`,
      `best ${service} near me`,
      `${service}${citySuffix}`,
      `${service} services${citySuffix}`,
    ]
  }

  const pickRandomKeywords = (items, count = 3) => {
    const pool = [...items]
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = pool[i]
      pool[i] = pool[j]
      pool[j] = tmp
    }
    return pool.slice(0, Math.min(count, pool.length))
  }

  const handleAutoGenerateKeywords = () => {
    if (!selectedBusiness) {
      toast.error('Please select a business first')
      return
    }

    const city = parseCityFromAddress(selectedBusiness.address)
    const normalizedGenerated = buildServiceKeywords(selectedBusiness, city)
      .map((kw) => kw.toLowerCase().replace(/\s+/g, ' ').trim())
      .filter((kw) => kw.length > 2)
    const existing = new Set(keywords.map((kw) => kw.toLowerCase().trim()))
    const candidates = normalizedGenerated.filter((kw) => !existing.has(kw))
    const generated = pickRandomKeywords(candidates.length ? candidates : normalizedGenerated, 3)

    // Keep existing keywords and append only unique new ones.
    const combined = Array.from(new Set([...keywords, ...generated]))
    setKeywords(combined)
    toast.success(`Generated ${combined.length - keywords.length} new keywords`)
  }

  const handleCreateProject = async () => {
    if (!selectedBusiness || keywords.length === 0) {
      toast.error('Please select a business and add at least one keyword')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Send all possible variations to ensure backend catches them
          placeId: selectedBusiness.placeId,
          businessId: selectedBusiness.placeId,
          name: selectedBusiness.name,
          businessName: selectedBusiness.name,
          address: selectedBusiness.address,
          coordinates: {
            lat: selectedBusiness.latitude,
            lng: selectedBusiness.longitude
          },
          keywords: keywords,
          gridSettings: {
            shape: gridShape,
            density: gridDensity,
            radius: gridRadius,
            unit: gridUnit
          }
        })
      })

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('No more credits. Please purchase more credits to run the scan.')
        }
        const err = await response.json()
        throw new Error(err.error || 'Failed to trigger scan')
      }

      const data = await response.json()
      toast.success(existingProjectId ? 'Scan started!' : 'Project created! Starting scan...')
      
      if (data.scanJobIds && data.scanJobIds.length > 0) {
        const firstScanId = data.scanJobIds[0]
        setActiveScanJobId(firstScanId)
        setScanning(true)
        setScanProgress(0)
        
        // Persist scan ID in URL so a refresh doesn't lose state
        const url = new URL(window.location.href)
        url.searchParams.set('rescanJobId', firstScanId)
        window.history.replaceState({}, '', url.toString())
      } else {
        router.push(`/dashboard/projects/${data.project.id}`)
      }
    } catch (error) {
      console.error('Create error:', error)
      toast.error(error.message)
    } finally {
      setCreating(false)
    }
  }

  const toggleSection = (section) => {
    setSidebarSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const estimatedLabel = scanning ? 'Estimated Time' : 'Estimated Cost'
  const estimatedValue = scanning ? '~2 min' : `${keywords.length * 100} Credits`
  const mapMarkers = useMemo(() => {
    return [
      ...(selectedBusiness ? [{ ...selectedBusiness, selected: true }] : searchResults),
      ...heatmapPins
    ]
  }, [selectedBusiness, searchResults, heatmapPins])

  return (
    <div className="flex flex-col flex-1 -m-4 md:-m-6 bg-white lg:bg-slate-50 relative overflow-y-auto lg:overflow-hidden">
      <div className="flex flex-col lg:flex-row flex-1 relative min-h-screen lg:min-h-0">
        
        {/* Map Center Area (70% on desktop, Top on mobile) */}
        <main className="w-full lg:flex-1 h-[38vh] sm:h-[42vh] lg:h-auto relative bg-slate-100 order-1 lg:order-2 border-b lg:border-b-0 border-slate-200">
          <GoogleMap 
            markers={mapMarkers}
            onMarkerClick={handleSelectBusiness}
            mapType={mapType}
            autoFit={!scanning}
            gridSettings={scanning ? null : {
              shape: gridShape,
              density: gridDensity,
              radius: gridRadius,
              unit: gridUnit,
              center: selectedBusiness
            }}
          />

          {/* Map Overlay Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 scale-90 sm:scale-100">
            <button 
              onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white border border-slate-200 rounded-xl shadow-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 overflow-hidden group"
              title={mapType === 'roadmap' ? 'Satellite View' : 'Roadmap View'}
            >
              {mapType === 'roadmap' ? (
                <Layers className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              ) : (
                <Building2 className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              )}
            </button>
            <button 
              onClick={() => {
                if (selectedBusiness) {
                  setHeatmapPins([...heatmapPins]) 
                }
              }}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white border border-slate-200 rounded-xl shadow-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 group"
              title="Center Map"
            >
              <MapPin className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
            </button>
          </div>

          {/* Scan Progress Overlay - Bottom Center */}
          {scanning && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 border border-blue-100 animate-in slide-in-from-bottom-5 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shadow-inner">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">Scanning Grid...</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Processing all keywords</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="uppercase tracking-wider text-[10px] text-slate-500">Overall Progress</span>
                    <span className="text-blue-600">{scanProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 transition-all duration-500 relative"
                      style={{ width: `${scanProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 font-medium pt-1">
                    Please keep this window open until 100%
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Left Sidebar (Now below map on mobile, Side on desktop) */}
        <aside className="w-full lg:w-[30%] lg:min-w-[320px] lg:max-w-[450px] min-w-0 max-w-none bg-white border-r lg:border-r border-slate-200 overflow-y-auto shadow-xl flex flex-col order-2 lg:order-1">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Heatmap Builder
            </h2>
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile primary action: keep Run Scan accessible at top */}
          <div className="lg:hidden sticky top-0 z-20 p-3 bg-white/95 backdrop-blur border-b border-slate-100">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">{estimatedLabel}</div>
                <div className="text-sm font-bold text-emerald-600 truncate">{estimatedValue}</div>
              </div>
            </div>
            <Button
              type="button"
              onClick={scanning ? handleCancelScan : handleCreateProject}
              isLoading={creating}
              cooldown={2000}
              disabled={!scanning && (!selectedBusiness || keywords.length === 0)}
              className={`w-full h-11 rounded-xl font-bold shadow transition-all ${
                scanning
                  ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
              }`}
            >
              {scanning ? 'Stop Scan' : 'Run Scan'}
            </Button>
          </div>

          <div className="flex-1">
            {/* Target Business Section */}
            <div className="border-b border-slate-100">
              <button 
                onClick={() => toggleSection('business')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-slate-700">Target Business</span>
                </div>
                {sidebarSections.business ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              
              {sidebarSections.business && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <Input 
                      className="pl-9 pr-8 h-10 text-sm border-slate-200 focus:ring-blue-500"
                      placeholder="Search business..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      autoComplete="off"
                    />
                    {searching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-lg shadow-inner bg-slate-50/50">
                      {searchResults.map((result) => (
                        <button
                          key={result.placeId}
                          onClick={() => handleSelectBusiness(result)}
                          className="w-full p-3 text-left border-b border-slate-100 hover:bg-white transition-colors group"
                        >
                          <div className="font-medium text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{result.name}</div>
                          <div className="text-xs text-slate-500 truncate">{result.address}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedBusiness && (
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">{selectedBusiness.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {selectedBusiness.address?.split(',')[0]}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-white text-[10px] font-medium border-blue-100">
                          ID: {selectedBusiness.placeId?.substring(0, 8)}...
                        </Badge>
                        <Badge variant="outline" className="bg-white text-[10px] font-medium border-blue-100">
                          Service Area
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Source Section */}
            <div className="border-b border-slate-100">
              <button 
                onClick={() => toggleSection('source')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-slate-700">Source</span>
                </div>
                {sidebarSections.source ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {sidebarSections.source && (
                <div className="px-4 pb-4 flex gap-4">
                  <button 
                    onClick={() => setSource('google-maps')}
                    className={`flex-1 p-2 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      source === 'google-maps' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <img src="https://www.google.com/favicon.ico" className="w-3 h-3" alt="" />
                    Google Maps
                  </button>
                  <button 
                    onClick={() => setSource('local-pack')}
                    className={`flex-1 p-2 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      source === 'local-pack' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Search className="w-3 h-3" />
                    Local Pack
                  </button>
                </div>
              )}
            </div>

            {/* Settings or Results Section */}
            <div className="border-b border-slate-100 flex-1 overflow-y-auto">
              <div className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  {scanAnalytics ? <RefreshCw className="w-4 h-4 text-blue-600" /> : <Settings className="w-4 h-4 text-blue-600" />}
                  <span className="font-semibold text-sm text-slate-700">{scanAnalytics ? 'Scan Results' : 'Settings'}</span>
                </div>
                {scanAnalytics && (
                  <Button onClick={handleReset} variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    NEW SCAN
                  </Button>
                )}
              </div>

              {scanAnalytics ? (
                <div className="p-4 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Performance Overview */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Visibility</div>
                      <div className="text-xl font-black text-blue-700">{scanAnalytics.visibilityScore}%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Avg. Rank</div>
                      <div className="text-xl font-black text-blue-700">{scanAnalytics.averageRank || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Distribution */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rank Distribution</label>
                    <div className="space-y-2">
                      {[
                        { label: 'Top 3', count: Math.round(scanAnalytics.top3Percentage * scanAnalytics.totalPoints / 100), color: 'bg-emerald-500' },
                        { label: 'Top 10', count: Math.round(scanAnalytics.top10Percentage * scanAnalytics.totalPoints / 100), color: 'bg-yellow-500' },
                        { label: 'Top 20', count: Math.round(scanAnalytics.top20Percentage * scanAnalytics.totalPoints / 100), color: 'bg-orange-500' },
                        { label: '20+', count: scanAnalytics.notFoundCount, color: 'bg-slate-400' }
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <div className="text-xs font-semibold text-slate-600 flex-1">{item.label}</div>
                          <div className="text-xs font-bold text-slate-800">{item.count} pins</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-bold">Search Insights</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Best Rank</span>
                        <span className="font-bold text-emerald-400">#{scanAnalytics.bestRank || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Total Points</span>
                        <span className="font-bold">{scanAnalytics.totalPoints}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 pb-4 space-y-6">
                  {/* Keywords */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keywords ({keywords.length})</label>
                      <button 
                        onClick={handleAutoGenerateKeywords}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition"
                      >
                        AUTO GENERATE
                      </button>
                    </div>
                    <div className="relative p-2 border border-slate-200 rounded-xl bg-slate-50/50 min-h-[100px] flex flex-wrap gap-2 content-start focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                      {keywords.map(kw => (
                        <Badge key={kw} className="bg-white text-slate-700 hover:bg-slate-50 border-slate-200 pr-1 gap-1 py-1">
                          {kw}
                          <button onClick={() => removeKeyword(kw)} className="p-0.5 hover:bg-slate-100 rounded-full transition">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      <form onSubmit={handleAddKeyword} className="flex-1 min-w-[120px]">
                        <input 
                          type="text"
                          className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 placeholder:text-slate-400"
                          placeholder="Add keyword..."
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onFocus={() => newKeyword.length >= 2 && setShowSuggestions(true)}
                          onBlur={() => {
                            // Delay hiding so clicks on suggestions can still fire
                            setTimeout(() => setShowSuggestions(false), 200)
                          }}
                        />
                      </form>

                      {/* Suggestions Dropdown */}
                      {showSuggestions && keywordSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-48 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          {keywordSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectSuggestion(suggestion)}
                              className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between group"
                            >
                              <span className="truncate">{suggestion}</span>
                              <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Map Grid Settings */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Map Grid</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Shape</label>
                        <select 
                          value={gridShape}
                          onChange={(e) => setGridShape(e.target.value)}
                          className="w-full h-9 rounded-lg border-slate-200 text-sm focus:ring-emerald-500"
                        >
                          <option value="circle">Circle</option>
                          <option value="square">Square</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Density</label>
                        <select 
                          value={gridDensity}
                          onChange={(e) => setGridDensity(Number(e.target.value))}
                          className="w-full h-9 rounded-lg border-slate-200 text-sm focus:ring-emerald-500"
                        >
                          <option value={49}>49 Pins | 7x7</option>
                          <option value={81}>81 Pins | 9x9</option>
                          <option value={133}>133 Pins [Recommended]</option>
                          <option value={225}>225 Pins | 15x15</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Radius ({gridUnit})</label>
                        <div className="flex">
                          <Input 
                            type="number" 
                            step="0.1"
                            min="0"
                            max={gridUnit === 'mi' ? 25 : 40}
                            value={gridRadius}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              const max = gridUnit === 'mi' ? 25 : 40
                              if (val > max) {
                                setGridRadius(max)
                                toast.error(`Maximum radius is ${max} ${gridUnit}`)
                              } else {
                                setGridRadius(Math.max(0, val))
                              }
                            }}
                            className="h-9 rounded-l-lg rounded-r-none border-r-0 text-sm w-full"
                          />
                          <Select value={gridUnit} onValueChange={setGridUnit}>
                            <SelectTrigger className="h-9 w-20 px-2 rounded-r-lg rounded-l-none border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 focus:ring-0">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mi">MI</SelectItem>
                              <SelectItem value="km">KM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:flex p-4 bg-slate-50 border-t border-slate-100 flex-col gap-3 sticky bottom-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  {estimatedLabel}
                </div>
                <div className="text-sm font-bold text-emerald-600">
                  {estimatedValue}
                </div>
              </div>
              
              <Button 
                type="button"
                onClick={scanning ? handleCancelScan : handleCreateProject}
                isLoading={creating}
                cooldown={2000}
                disabled={!scanning && (!selectedBusiness || keywords.length === 0)}
                className={`flex-1 h-12 rounded-xl font-bold shadow-lg transition-all text-base ${
                  scanning 
                    ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                }`}
              >
                {scanning ? 'Stop Scan' : 'Run Scan'}
              </Button>
            </div>
            {activeScanJobId && scanProgress === 100 && (
              <Button 
                asChild 
                variant="outline" 
                className="w-full h-11 rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50 mt-1"
              >
                <Link href={`/dashboard/scans/${activeScanJobId}`}>
                  View Full Report
                </Link>
              </Button>
            )}
          </div>
        </aside>

        </div>
      </div>
    )
  }

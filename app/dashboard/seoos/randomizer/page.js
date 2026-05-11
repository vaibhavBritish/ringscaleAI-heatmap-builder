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
  Target, Zap, CreditCard, RefreshCw, Layers, ChevronRight, Phone, Sparkles, BarChart3
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import Link from 'next/link'
import GoogleMap from '@/components/GoogleMap'
import { generateHeatmapGrid } from '@/lib/heatmap-utils'
import { calculateAnalytics } from '@/lib/grid-utils'
import { useCountry } from '@/hooks/use-country'

export default function AdminRandomizerPage() {
  const { data: session } = useSession()
  const userPlan = session?.user?.plan || 'admin'
  const { isIndia } = useCountry()
  
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
  
  // ADMIN RANDOMIZER SPECIFIC
  const [isMock, setIsMock] = useState(true)
  const [greenPinPercentage, setGreenPinPercentage] = useState(70)
  
  // Scanning State
  const [scanning, setScanning] = useState(false)
  const [activeScanJobId, setActiveScanJobId] = useState(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanAnalytics, setScanAnalytics] = useState(null)
  const [topCompetitors, setTopCompetitors] = useState([])
  
  // Auto-clamp radius when unit changes or session loads
  useEffect(() => {
    // Admins have higher limits or just use 25 miles as default max
    const maxMiles = 25
    const max = gridUnit === 'mi' ? maxMiles : Math.round(maxMiles * 1.60934)
    
    if (gridRadius > max) {
      setGridRadius(max)
    }
  }, [gridUnit, gridRadius])
  

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
        name: proj.businessName,
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
        if (proj.gridSettings.isMock !== undefined) setIsMock(proj.gridSettings.isMock)
        if (proj.gridSettings.greenPinPercentage !== undefined) setGreenPinPercentage(proj.gridSettings.greenPinPercentage)
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

  // Generate grid when center or settings change
  useEffect(() => {
    if (selectedBusiness && !scanning && !scanAnalytics) {
      const timer = setTimeout(() => {
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

  // Polling logic for scan results
  useEffect(() => {
    let pollInterval
    
    if (scanning && activeScanJobId) {
      pollInterval = setInterval(async () => {
        if (document.visibilityState !== 'visible') return

        try {
          const response = await fetch(`/api/scans/${activeScanJobId}/results?aggregate=true`)
          if (!response.ok) throw new Error('Failed to fetch results')
          
          const data = await response.json()
          
          const allScans = data.projectScans || [data.scanJob]
          const totalProcessed = allScans.reduce((sum, s) => sum + (s.processedPoints || 0), 0)
          const totalPoints = allScans.reduce((sum, s) => sum + (s.totalPoints || 0), 0)
          
          if (totalPoints > 0) {
            const progress = Math.min(100, Math.round((totalProcessed / totalPoints) * 100))
            setScanProgress(progress)
          }
          
          if (data.results && data.results.length > 0) {
            setHeatmapPins(prevPins => {
              return prevPins.map((pin) => {
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
          
          const allDone = allScans.every((s) => {
            if (['completed', 'failed', 'cancelled'].includes(s.status)) return true
            const total = s.totalPoints || 0
            const processed = s.processedPoints || 0
            return total > 0 && processed >= total
          })
          
          if (allDone) {
            setScanning(false)
            clearInterval(pollInterval)
            
            if (data.results) {
              const analytics = calculateAnalytics(data.results)
              setScanAnalytics(analytics)

              // Calculate top competitors
              const competitorMap = {}
              data.results.forEach(r => {
                if (r.competitorsJson) {
                  try {
                    const comps = JSON.parse(r.competitorsJson)
                    comps.forEach(c => {
                      if (!competitorMap[c.placeId]) {
                        competitorMap[c.placeId] = { ...c, occurrences: 0, avgRank: 0, totalRank: 0 }
                      }
                      competitorMap[c.placeId].occurrences++
                      competitorMap[c.placeId].totalRank += c.rank
                    })
                  } catch (e) {}
                }
              })
              const topComps = Object.values(competitorMap)
                .map(c => ({ ...c, avgRank: Math.round((c.totalRank / c.occurrences) * 10) / 10 }))
                .sort((a, b) => b.occurrences - a.occurrences || a.avgRank - b.avgRank)
                .slice(0, 5)
              setTopCompetitors(topComps)
            }
            toast.success('Randomized report generated!')
          }
        } catch (error) {
          console.error('Polling error:', error)
        }
      }, isMock ? 2000 : 8000) // Faster polling for mock scans
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [scanning, activeScanJobId, isMock])

  const handleCancelScan = async () => {
    if (!activeScanJobId) return
    try {
      await fetch(`/api/scans/${activeScanJobId}/cancel`, { method: 'POST' })
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
    setTopCompetitors([])
    setHeatmapPins([])
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
    try {
      const response = await fetch('/api/google/search-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setSearchResults(data.results || [])
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

  const handleAutoGenerateKeywords = () => {
    if (!selectedBusiness) {
      toast.error('Please select a business first')
      return
    }
    const city = parseCityFromAddress(selectedBusiness.address)
    // Simple mock keyword generation for admin
    const generated = [`best ${selectedBusiness.name} in ${city}`, `${selectedBusiness.name} near me`]
    const combined = Array.from(new Set([...keywords, ...generated]))
    setKeywords(combined)
    toast.success(`Generated new keywords`)
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
          placeId: selectedBusiness.placeId,
          name: selectedBusiness.name,
          address: selectedBusiness.address,
          coordinates: { lat: selectedBusiness.latitude, lng: selectedBusiness.longitude },
          keywords: keywords,
          gridSettings: {
            shape: gridShape,
            density: gridDensity,
            radius: gridRadius,
            unit: gridUnit,
            isMock: isMock,
            greenPinPercentage: greenPinPercentage
          }
        })
      })

      if (!response.ok) throw new Error('Failed to start scan')

      const data = await response.json()
      toast.success('Randomizer Scan Started!')
      
      if (data.scanJobIds && data.scanJobIds.length > 0) {
        setActiveScanJobId(data.scanJobIds[0])
        setScanning(true)
        setScanProgress(0)
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

  const mapMarkers = useMemo(() => {
    return [
      ...(selectedBusiness ? [{ ...selectedBusiness, selected: true }] : searchResults),
      ...heatmapPins
    ]
  }, [selectedBusiness, searchResults, heatmapPins])

  return (
    <div className="flex flex-col flex-1 -m-4 md:-m-6 bg-white lg:bg-slate-50 relative overflow-y-auto lg:overflow-hidden">
      <div className="flex flex-col lg:flex-row flex-1 relative min-h-screen lg:min-h-0">
        
        {/* Map Center Area */}
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
            >
              {mapType === 'roadmap' ? <Layers className="w-5 h-5 text-slate-600 group-hover:text-blue-600" /> : <Building2 className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />}
            </button>
          </div>

          {/* Scan Progress Overlay */}
          {scanning && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 border border-red-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">Generating Mock Results...</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Randomizer Engine Active</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="uppercase tracking-wider text-[10px] text-slate-500">Progress</span>
                    <span className="text-red-600">{scanProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-500" style={{ width: `${scanProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Left Sidebar */}
        <aside className="w-full lg:w-[30%] lg:min-w-[320px] lg:max-w-[450px] min-w-0 max-w-none bg-white border-r lg:border-r border-slate-200 overflow-y-auto shadow-xl flex flex-col order-2 lg:order-1">
          <div className="p-4 border-b border-slate-100 bg-red-50/30 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-600" />
              Admin Randomizer
            </h2>
            <Link href="/dashboard/seoos">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Target Business Section */}
            <div className="border-b border-slate-100">
              <button onClick={() => toggleSection('business')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-sm text-slate-700">Sandbox Business</span>
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
                      className="pl-9 pr-8 h-10 text-sm border-slate-200 focus:ring-red-500"
                      placeholder="Search business to mock..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-lg bg-slate-50/50">
                      {searchResults.map((result) => (
                        <button key={result.placeId} onClick={() => handleSelectBusiness(result)} className="w-full p-3 text-left border-b border-slate-100 hover:bg-white group">
                          <div className="font-medium text-sm text-slate-900 group-hover:text-red-600">{result.name}</div>
                          <div className="text-xs text-slate-500 truncate">{result.address}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedBusiness && (
                    <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-red-200 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">{selectedBusiness.name}</div>
                          <div className="text-xs text-slate-500 truncate">{selectedBusiness.address}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Analytics & Competitors Section */}
            {scanAnalytics && (
              <div className="border-b border-slate-100 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-sm text-slate-700">Scan Analytics</span>
                  </div>
                </div>
                <div className="p-4 space-y-6">
                  {/* Performance Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-[10px] font-bold text-blue-400 uppercase">Visibility</div>
                      <div className="text-xl font-black text-blue-700">{scanAnalytics.visibilityScore}%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-[10px] font-bold text-blue-400 uppercase">Avg Rank</div>
                      <div className="text-xl font-black text-blue-700">{scanAnalytics.averageRank}</div>
                    </div>
                  </div>

                  {/* Top Competitors */}
                  {topCompetitors.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Competitors</label>
                      <div className="space-y-2">
                        {topCompetitors.map((comp, idx) => (
                          <div key={comp.placeId} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{comp.name}</div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                <span className="flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> {comp.occurrences} pins</span>
                                <span className="flex items-center gap-0.5"><Zap className="w-2.5 h-2.5 text-amber-500" /> Avg #{comp.avgRank}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
              </div>
            )}

            {/* Randomizer Settings */}
            <div className="border-b border-slate-100">
              <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-sm text-slate-700">Randomizer Engine</span>
                </div>
              </div>
              
              <div className="p-4 space-y-6">
                {/* Keywords */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keywords</label>
                    <button onClick={handleAutoGenerateKeywords} className="text-[10px] font-bold text-red-600">AUTO GENERATE</button>
                  </div>
                  <div className="p-2 border border-slate-200 rounded-xl bg-slate-50/50 min-h-[80px] flex flex-wrap gap-2">
                    {keywords.map(kw => (
                      <Badge key={kw} className="bg-white text-slate-700 border-slate-200">
                        {kw}
                        <button onClick={() => removeKeyword(kw)} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                    <form onSubmit={handleAddKeyword} className="flex-1 min-w-[100px]">
                      <input 
                        type="text"
                        className="w-full bg-transparent border-none focus:ring-0 text-sm p-0"
                        placeholder="Add keyword..."
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                      />
                    </form>
                  </div>
                </div>

                {/* Grid */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Grid Settings</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Shape</label>
                      <select value={gridShape} onChange={(e) => setGridShape(e.target.value)} className="w-full h-9 rounded-lg border-slate-200 text-sm">
                        <option value="circle">Circle</option>
                        <option value="square">Square</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Density</label>
                      <select value={gridDensity} onChange={(e) => setGridDensity(Number(e.target.value))} className="w-full h-9 rounded-lg border-slate-200 text-sm">
                        <option value={49}>49 Pins</option>
                        <option value={81}>81 Pins</option>
                        <option value={133}>133 Pins</option>
                        {session?.user?.role === 'admin' && (
                          <option value={225}>225 Pins</option>
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Radius ({gridUnit})</label>
                    <div className="flex">
                      <Input type="number" step="0.1" value={gridRadius} onChange={(e) => setGridRadius(Math.max(0, Number(e.target.value)))} className="h-9 rounded-l-lg rounded-r-none border-r-0 text-sm w-full" />
                      <Select value={gridUnit} onValueChange={setGridUnit}>
                        <SelectTrigger className="h-9 w-20 px-2 rounded-r-lg rounded-l-none border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mi">MI</SelectItem>
                          <SelectItem value="km">KM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Mock Settings */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="space-y-3 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-red-600 uppercase tracking-wider">Mock Engine Active</label>
                      <input type="checkbox" checked={isMock} readOnly className="h-4 w-4 rounded border-slate-300 text-red-600" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Green Pins Ratio</label>
                        <span className="text-[10px] font-bold text-red-600">{greenPinPercentage}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={greenPinPercentage} 
                        onChange={(e) => setGreenPinPercentage(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 sticky bottom-0 z-20">
            {scanAnalytics ? (
              <Button onClick={handleReset} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg">
                <RefreshCw className="w-4 h-4 mr-2" /> RESET FOR NEW MOCK
              </Button>
            ) : (
              <Button 
                onClick={handleCreateProject}
                isLoading={creating}
                disabled={scanning || !selectedBusiness || keywords.length === 0}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200"
              >
                {scanning ? 'GENERATING...' : 'GENERATE RANDOMIZED REPORT'}
              </Button>
            )}
            {activeScanJobId && scanProgress === 100 && (
              <Button asChild variant="outline" className="w-full h-11 rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50 mt-2">
                <Link href={`/dashboard/scans/${activeScanJobId}`}>VIEW FULL REPORT</Link>
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

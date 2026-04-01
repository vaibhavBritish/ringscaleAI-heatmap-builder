"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { 
  Loader2, 
  Save, 
  Globe, 
  CreditCard, 
  Key, 
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  ShieldCheck
} from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/settings")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch settings")
      setSettings(data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (key, value) => {
    try {
      setSaving(true)
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update setting")
      
      setSettings(prev => ({ ...prev, [key]: value }))
      toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} updated successfully`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500 italic">
          {loading ? "Syncing system configuration..." : "Preparing settings dashboard..."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage global platform configuration and defaults.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-100 dark:bg-slate-900">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Globe size={20} />
                </div>
                <div>
                  <CardTitle>Branding & Support</CardTitle>
                  <CardDescription>Configure basic platform information and support details.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appName">Platform Name</Label>
                  <div className="relative">
                    <SettingsIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                      id="appName" 
                      className="pl-9"
                      value={settings.branding.appName}
                      onChange={(e) => setSettings({
                        ...settings,
                        branding: { ...settings.branding, appName: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                      id="supportEmail" 
                      className="pl-9"
                      value={settings.branding.supportEmail}
                      onChange={(e) => setSettings({
                        ...settings,
                        branding: { ...settings.branding, supportEmail: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                      id="supportPhone" 
                      className="pl-9"
                      value={settings.branding.supportPhone}
                      onChange={(e) => setSettings({
                        ...settings,
                        branding: { ...settings.branding, supportPhone: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20">
                  <div className="space-y-0.5">
                    <Label className="text-blue-900 dark:text-blue-300">Maintenance Mode</Label>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Disable new scans and restrict public access.</p>
                  </div>
                  <Switch 
                    checked={settings.branding.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      branding: { ...settings.branding, maintenanceMode: checked }
                    })}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-6 flex justify-end">
              <Button 
                onClick={() => handleUpdate("branding", settings.branding)} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Plan Settings */}
        <TabsContent value="plans" className="mt-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CreditCard size={20} />
                </div>
                <div>
                  <CardTitle>Plan Defaults & Credits</CardTitle>
                  <CardDescription>Manage default credit assignments for each subscription tier.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(settings.plans).map(([key, config]) => (
                  <div key={key} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-950">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`plan-${key}`} className="capitalize font-bold text-slate-700 dark:text-slate-300">{config.name}</Label>
                      <ShieldCheck size={14} className="text-slate-300" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`credits-${key}`} className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Included Credits</Label>
                      <Input 
                        id={`credits-${key}`}
                        type="number"
                        value={config.credits}
                        onChange={(e) => setSettings({
                          ...settings,
                          plans: {
                            ...settings.plans,
                            [key]: { ...config, credits: parseInt(e.target.value) || 0 }
                          }
                        })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-6 flex justify-end">
              <Button 
                onClick={() => handleUpdate("plans", settings.plans)} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Plan Config
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="mt-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Key size={20} />
                </div>
                <div>
                  <CardTitle>Internal API Configuration</CardTitle>
                  <CardDescription>View connection status of your external service integrations.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(settings.api_status).map(([service, isConfigured]) => (
                  <div key={service} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-900/10 dark:bg-slate-950/20">
                    <div className="flex items-center gap-3">
                      {isConfigured ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : (
                        <XCircle size={18} className="text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-200">{service.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-[11px] text-slate-500 italic">
                          {isConfigured ? "Connected & Verified" : "Key missing in .env"}
                        </p>
                      </div>
                    </div>
                    {isConfigured && (
                      <div className="px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-tight dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-slate-100 dark:bg-slate-900 border-l-4 border-slate-300 text-slate-600 dark:text-slate-400 text-sm">
                <p><strong>Note:</strong> API keys are managed via environment variables for security. The indicators above show if the system can currently detect those keys.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

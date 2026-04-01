"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, UserPlus, UserRoundPen } from "lucide-react"

export function UserModal({ isOpen, onClose, user, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    plan: "Trial",
    credits: 300
  })

  const [planSettings, setPlanSettings] = useState(null)

  useEffect(() => {
    const fetchPlanSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings")
        const data = await res.json()
        if (res.ok && data.plans) {
          setPlanSettings(data.plans)
        }
      } catch (err) {
        console.error("Failed to fetch plan settings:", err)
      }
    }
    fetchPlanSettings()
  }, [])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "", // Don't pre-fill password for editing
        role: user.role || "user",
        plan: user.plan || "Trial",
        credits: user.credits || 0
      })
    } else {
      const defaultPlan = "Trial"
      const defaultCredits = planSettings?.[defaultPlan]?.credits || 300
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        plan: defaultPlan,
        credits: defaultCredits
      })
    }
  }, [user, planSettings])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = user ? `/api/admin/users/${user.id}` : "/api/admin/users"
      const method = user ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to save user")

      toast.success(user ? "User updated successfully" : "User created successfully")
      onRefresh()
      onClose()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${user ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
              {user ? <UserRoundPen size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
              <DialogDescription>
                {user ? "Modify the user's profile and plan details." : "Create a new user account with specific roles and credits."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            {!user && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan">Plan</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    plan: value,
                    credits: user ? formData.credits : (planSettings?.[value]?.credits || 0)
                  })}
                >
                  <SelectTrigger className="capitalize">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Trial">Trial</SelectItem>
                    <SelectItem value="advance">Advance</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="pro_plus">Pro Plus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credits" className="flex justify-between">
                <span>Available Credits</span>
                <span className="text-[10px] text-blue-500 font-normal">Auto-filled based on plan</span>
              </Label>
              <Input
                id="credits"
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

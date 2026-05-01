"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Building, Mail, Globe, Phone, Info, Upload, X, ImageIcon } from "lucide-react"

export function CompanyModal({ isOpen, onClose, company, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    slug: "",
    logo: "",
  })

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        email: company.email || "",
        phone: company.phone || "",
        website: company.website || "",
        slug: company.slug || "",
        logo: company.logo || "",
      })
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        website: "",
        slug: "",
        logo: "",
      })
    }
  }, [company, isOpen])

  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = (file) => {
    if (!file) return
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    // Check size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logo: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileUpload(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = company 
        ? `/api/admin/companies/${company.id}` 
        : "/api/admin/companies"
      
      const method = company ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Something went wrong")

      toast.success(company ? "Company updated successfully" : "Company and Partner Admin created successfully")
      
      if (!company && data.tempPassword) {
        // Show credentials for new company admin
        alert(`Partner Admin Account Created!\n\nEmail: ${formData.email}\nPassword: ${data.tempPassword}\n\nPlease share these credentials with the partner.`)
      }

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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            {company ? "Edit Partner Company" : "Add New Partner Company"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {!company && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-700">
              <Info className="w-5 h-5 shrink-0" />
              <p>Adding a company will automatically generate a <strong>Partner Admin</strong> account with the email provided below. The login credentials will be emailed to them.</p>
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Company Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="name"
                  placeholder="e.g. SEO Solutions Ltd"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Admin Email (for account generation)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@partner-company.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!company}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="website"
                    placeholder="https://company.com"
                    className="pl-10"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Company Logo (Required for white-labeling)</Label>
              {formData.logo ? (
                <div className="relative group rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50 flex items-center justify-center p-2 min-h-[120px] max-h-[240px]">
                  <img 
                    src={formData.logo} 
                    alt="Logo preview" 
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logo: "" }))}
                    className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer
                    ${isDragging ? 'border-blue-500 bg-blue-50/50 scale-[0.98]' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'}
                  `}
                  onClick={() => document.getElementById('logo-upload').click()}
                >
                  <input
                    id="logo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                  />
                  <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                    <Upload size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">Click or drag logo here</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG or SVG (Max 2MB)</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Custom URL Slug (Optional)</Label>
              <Input
                id="slug"
                placeholder="company-name"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
              />
              <p className="text-[10px] text-slate-500 italic">Used for white-labeled portals: {formData.slug || 'slug'}.yourdomain.com</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : company ? "Save Changes" : "Create Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

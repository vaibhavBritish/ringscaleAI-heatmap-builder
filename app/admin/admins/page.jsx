"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Plus, Trash2, Mail, User as UserIcon, Shield } from "lucide-react"

export default function AdminManagementPage() {
  const { data: session } = useSession()
  const [adminList, setAdminList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "admin" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins")
      if (!res.ok) throw new Error("Failed to fetch admins")
      const data = await res.json()
      setAdminList(data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Failed to create admin")
      
      toast.success("Administrator added successfully")
      setShowAddForm(false)
      setFormData({ name: "", email: "", password: "", role: "admin" })
      fetchAdmins()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAdmin = async (id) => {
    if (!confirm("Are you sure you want to remove this administrator?")) return
    
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete admin")
      
      toast.success("Administrator removed")
      fetchAdmins()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleRoleChange = async (id, newRole) => {
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update role")
      
      toast.success("Role updated successfully")
      fetchAdmins()
    } catch (error) {
      toast.error(error.message)
      // reset state locally if needed, but fetchAdmins() handles it well enough
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  // Restrict access explicitly in UI
  if (session?.user?.role !== "superadmin") {
    return <div className="p-8 text-red-500">You do not have access to this page. Super Admin only.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Management</h1>
          <p className="text-sm text-slate-500">Add and manage platform administrators and super admins.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? "Cancel" : "Add Admin"}
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold mb-4">Add New Administrator</h2>
          <form onSubmit={handleAddAdmin} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
              <input 
                type="text" 
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input 
                type="email" 
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <input 
                type="password" 
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {isSubmitting ? "Creating..." : "Create Administrator"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                <th className="px-6 py-4 font-medium text-slate-500">Name</th>
                <th className="px-6 py-4 font-medium text-slate-500">Email</th>
                <th className="px-6 py-4 font-medium text-slate-500">Role</th>
                <th className="px-6 py-4 font-medium text-slate-500">Joined</th>
                <th className="px-6 py-4 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {adminList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No administrators found.
                  </td>
                </tr>
              ) : (
                adminList.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${admin.role === 'superadmin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {admin.role === 'superadmin' ? <Shield className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                        </div>
                        <span className="font-medium">{admin.name || "N/A"}</span>
                        {session?.user?.id === admin.id && (
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail className="h-4 w-4" />
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {session?.user?.id !== admin.id ? (
                        <select
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                          value={admin.role}
                          onChange={(e) => handleRoleChange(admin.id, e.target.value)}
                        >
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30">
                          Super Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {session?.user?.id !== admin.id ? (
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Remove administrator"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

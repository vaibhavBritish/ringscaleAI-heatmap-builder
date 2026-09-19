"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Plus, Trash2, Edit, User as UserIcon, DollarSign } from "lucide-react"
import { SalesDialog } from "@/components/admin/SalesDialog"

export default function SalesManagementPage() {
  const { data: session } = useSession()
  const [salesList, setSalesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const res = await fetch("/api/admin/sales")
      if (!res.ok) throw new Error("Failed to fetch sales records")
      const data = await res.json()
      setSalesList(data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData) => {
    try {
      const url = editingRecord ? `/api/admin/sales/${editingRecord.id}` : "/api/admin/sales"
      const method = editingRecord ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Failed to save record")
      
      toast.success(editingRecord ? "Record updated" : "Record created")
      setIsDialogOpen(false)
      fetchSales()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this sales record?")) return
    
    try {
      const res = await fetch(`/api/admin/sales/${id}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete record")
      
      toast.success("Record deleted")
      fetchSales()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const openNewDialog = () => {
    setEditingRecord(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (record) => {
    setEditingRecord(record)
    setIsDialogOpen(true)
  }

  if (loading) return <div className="p-8">Loading...</div>

  // Restrict access explicitly in UI just in case
  if (!['superadmin', 'admin', 'staff'].includes(session?.user?.role)) {
    return <div className="p-8 text-red-500">You do not have access to this page.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales CRM</h1>
          <p className="text-sm text-slate-500">Manage sales, leads, and customer status.</p>
        </div>
        <button
          onClick={openNewDialog}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Record
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                <th className="px-6 py-4 font-medium text-slate-500">Customer</th>
                <th className="px-6 py-4 font-medium text-slate-500">Status</th>
                <th className="px-6 py-4 font-medium text-slate-500">Financials</th>
                <th className="px-6 py-4 font-medium text-slate-500">Subscription</th>
                {session?.user?.role !== 'staff' && (
                  <th className="px-6 py-4 font-medium text-slate-500">Staff Agent</th>
                )}
                <th className="px-6 py-4 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {salesList.length === 0 ? (
                <tr>
                  <td colSpan={session?.user?.role !== 'staff' ? 6 : 5} className="px-6 py-8 text-center text-slate-500">
                    No sales records found.
                  </td>
                </tr>
              ) : (
                salesList.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{sale.customerName}</div>
                      <div className="text-slate-500 text-xs">{sale.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        sale.status === 'Converted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        sale.status === 'Lost' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-slate-900 dark:text-slate-100">
                          <span className="text-xs text-slate-500">Total:</span> ${sale.totalPayment}
                        </div>
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <span className="text-xs text-slate-500">Remaining:</span> ${sale.remainingPayment}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-slate-100 capitalize">{sale.subscriptionBasis || "None"}</div>
                      <div className="text-slate-500 text-xs">{sale.subscriptionDuration || "-"}</div>
                    </td>
                    {session?.user?.role !== 'staff' && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">{sale.staff?.name || "Unknown"}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditDialog(sale)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                          title="Edit record"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SalesDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        initialData={editingRecord}
      />
    </div>
  )
}

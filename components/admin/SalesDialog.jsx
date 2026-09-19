"use client"

import { useState, useEffect } from "react"

export function SalesDialog({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    status: "Lead",
    totalPayment: 0,
    remainingPayment: 0,
    subscriptionBasis: "",
    subscriptionDuration: "",
    notes: ""
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        customerName: "",
        customerEmail: "",
        status: "Lead",
        totalPayment: 0,
        remainingPayment: 0,
        subscriptionBasis: "",
        subscriptionDuration: "",
        notes: ""
      })
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-xl font-bold mb-4">{initialData ? "Edit Sales Record" : "Add Sales Record"}</h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Customer Name</label>
            <input 
              type="text" 
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Customer Email</label>
            <input 
              type="email" 
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={formData.customerEmail}
              onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select 
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="Lead">Lead</option>
              <option value="Negotiating">Negotiating</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Payment ($)</label>
            <input 
              type="number" 
              step="0.01"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={formData.totalPayment}
              onChange={(e) => setFormData({...formData, totalPayment: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Remaining Payment ($)</label>
            <input 
              type="number" 
              step="0.01"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={formData.remainingPayment}
              onChange={(e) => setFormData({...formData, remainingPayment: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subscription Basis</label>
            <select 
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={formData.subscriptionBasis}
              onChange={(e) => setFormData({...formData, subscriptionBasis: e.target.value})}
            >
              <option value="">None</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subscription Duration</label>
            <input 
              type="text" 
              placeholder="e.g. 12 months, lifetime"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={formData.subscriptionDuration}
              onChange={(e) => setFormData({...formData, subscriptionDuration: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea 
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          
          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

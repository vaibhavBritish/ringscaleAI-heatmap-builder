"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Shield,
  CreditCard,
  ArrowUpRight,
  Undo2,
  Building2,
  AlertCircle
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card"
import { ClientModal } from "@/components/dashboard/ClientModal"
import { TransferModal } from "@/components/dashboard/TransferModal"
import { PaginationBar } from "@/components/dashboard/PaginationBar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

const PAGE_SIZE = 10

const getPlanLabel = (plan) => {
  const id = (plan || 'trial').toLowerCase()
  if (id.includes('lite') || id.includes('advance')) return 'Advance'
  if (id.includes('pro_plus') || id.includes('pro plus')) return 'Pro Plus'
  if (id.includes('pro')) return 'Pro'
  if (id.includes('trial')) return 'Trial'
  return id.charAt(0).toUpperCase() + id.slice(1)
}

const isClientExpired = (client) => {
  const expiry = client.planEndsAt || client.trialEndsAt
  return (expiry && new Date(expiry) < new Date()) || client.credits <= 0
}

export default function PartnerClientsPage() {
  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [transferMode, setTransferMode] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [partnerCredits, setPartnerCredits] = useState(0)
  const [clientToDelete, setClientToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPartnerCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/user/credits')
      if (res.ok) {
        const data = await res.json()
        setPartnerCredits(data.credits)
      }
    } catch (e) {
      console.error("Failed to fetch partner credits")
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search: debouncedSearch, status, page: String(page), pageSize: String(PAGE_SIZE) })
      const res = await fetch(`/api/partner/clients?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load clients")

      // Step back a page if the current one emptied out (e.g. after deleting its last client)
      if (data.users.length === 0 && page > 1) {
        setPage(page - 1)
        return
      }
      setClients(data.users || [])
      setTotal(data.total || 0)
      fetchPartnerCredits()
    } catch (error) {
      console.error("Failed to fetch clients:", error)
      toast.error("Failed to load clients")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, status, page, fetchPartnerCredits])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleDelete = async () => {
    if (!clientToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/partner/clients/${clientToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete client")
      toast.success(data.refundedCredits > 0
        ? `Client deleted. ${data.refundedCredits} credits returned to your pool.`
        : "Client deleted successfully")
      fetchClients()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDeleting(false)
      setClientToDelete(null)
    }
  }

  const openTransfer = (client, mode) => {
    setSelectedClient(client)
    setTransferMode(mode)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Clients</h1>
          <p className="text-slate-500 mt-1">Manage and onboard your own clients under your agency brand.</p>
        </div>
        <Button
          onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
        >
          <Plus size={18} className="mr-2" /> Add New Client
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-slate-500">Agency Credits</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-slate-900">{partnerCredits.toLocaleString()}</span>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <CreditCard size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-slate-500">
              {status === 'all' && !debouncedSearch ? 'Total Clients' : 'Matching Clients'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-slate-900">{total.toLocaleString()}</span>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Users size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-200">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search by name or email..."
                className="pl-10 h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 text-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="active">Has Credits</SelectItem>
                <SelectItem value="no_credits">Out of Credits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6">Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Businesses</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={6} className="h-16 px-6">
                      <div className="h-10 rounded-lg bg-slate-100" />
                    </TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Users size={48} className="opacity-20" />
                      <p className="font-medium">No clients found</p>
                      <p className="text-sm">
                        {debouncedSearch || status !== 'all' ? 'Try a different search or filter' : 'Start by adding your first client'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => {
                  const expired = isClientExpired(client)
                  return (
                  <TableRow key={client.id} className="hover:bg-slate-50/50 border-slate-100">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-200">
                          {(client.name || client.email)?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{client.name || "Unnamed client"}</p>
                          <p className="text-xs text-slate-500 truncate">{client.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">{getPlanLabel(client.plan)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1.5 font-bold ${expired ? 'text-rose-600' : 'text-slate-700'}`}>
                        {expired ? <AlertCircle size={14} /> : <Shield size={14} className="text-emerald-500" />}
                        {client.credits.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <span className="flex items-center gap-1.5"><Building2 size={14} className="text-slate-400" />{client.businesses}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium whitespace-nowrap">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" aria-label={`Actions for ${client.name || client.email}`}>
                             <MoreHorizontal size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => { setSelectedClient(client); setIsModalOpen(true); }}>
                            <Pencil size={14} /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => openTransfer(client, 'add')}>
                             <ArrowUpRight size={14} /> Add Credits
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            disabled={client.credits <= 0}
                            onClick={() => openTransfer(client, 'reclaim')}
                          >
                             <Undo2 size={14} /> Reclaim Credits
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer gap-2">
                            <Link href="/dashboard/citations"><Building2 size={14} /> Manage Citations</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                            onClick={() => setClientToDelete(client)}
                          >
                            <Trash2 size={14} /> Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          </div>
          <PaginationBar
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            itemLabel={total === 1 ? 'client' : 'clients'}
            className="px-4 sm:px-6 py-4 border-t border-slate-100"
          />
        </CardContent>
      </Card>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={selectedClient}
        onRefresh={fetchClients}
        poolCredits={partnerCredits}
      />

      <TransferModal
        isOpen={Boolean(transferMode)}
        onClose={() => setTransferMode(null)}
        client={selectedClient}
        mode={transferMode || 'add'}
        poolCredits={partnerCredits}
        onRefresh={fetchClients}
      />

      <AlertDialog open={Boolean(clientToDelete)} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-red-600 mb-2">
               <div className="p-2 rounded-full bg-red-50">
                 <Trash2 size={24} />
               </div>
               <AlertDialogTitle>Delete this client?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete <span className="font-bold text-slate-900">{clientToDelete?.name || clientToDelete?.email}</span> and their login.
              {clientToDelete?.credits > 0 && (
                <> Their remaining <span className="font-bold text-slate-900">{clientToDelete.credits.toLocaleString()} credits</span> will be returned to your agency pool.</>
              )}
              {' '}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete Client'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

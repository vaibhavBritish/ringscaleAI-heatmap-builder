"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Users,
  ExternalLink,
  Loader2,
  Filter,
  Shield,
  CreditCard,
  ArrowUpRight
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Card, 
  CardContent, 
  CardHeader 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClientModal } from "@/components/dashboard/ClientModal"
import { TransferModal } from "@/components/dashboard/TransferModal"
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
import { useSession } from "next-auth/react"
import { toast } from "sonner"

export default function PartnerClientsPage() {
  const { data: session } = useSession()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [partnerCredits, setPartnerCredits] = useState(0)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState(null)

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

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/partner/clients?search=${search}`)
      const data = await res.json()
      setClients(data.users || [])
      fetchPartnerCredits()
    } catch (error) {
      console.error("Failed to fetch clients:", error)
      toast.error("Failed to load clients")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients()
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [fetchClients])

  const handleDelete = async () => {
    if (!clientToDelete) return
    try {
      const res = await fetch(`/api/partner/clients/${clientToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete client")
      toast.success("Client deleted successfully")
      fetchClients()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsDeleteOpen(false)
      setClientToDelete(null)
    }
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-200">
        <CardHeader className="pb-3 px-6">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-10 h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-10 text-slate-600">
              <Filter size={16} className="mr-2" /> Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6">Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Joined At</TableHead>
                <TableHead align="right" className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={5} className="h-16 px-6">
                      <div className="h-10 rounded-lg bg-slate-100" />
                    </TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Users size={48} className="opacity-20" />
                      <p className="font-medium">No clients found</p>
                      <p className="text-sm">Start by adding your first client</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-slate-50/50 border-slate-100">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-200">
                          {client.name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <span className="font-semibold text-slate-900">{client.name || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {client.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Shield size={14} className="text-emerald-500" />
                        {client.credits}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                             <MoreHorizontal size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => { setSelectedClient(client); setIsModalOpen(true); }}>
                            <Pencil size={14} /> Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => { setSelectedClient(client); setIsTransferOpen(true); }}>
                             <ArrowUpRight size={14} /> Add Credits
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => toast.info("Impersonation feature coming soon")}>
                             <ExternalLink size={14} /> View as Client
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                            onClick={() => { setClientToDelete(client); setIsDeleteOpen(true); }}
                          >
                            <Trash2 size={14} /> Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        client={selectedClient}
        onRefresh={fetchClients}
      />

      <TransferModal 
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        client={selectedClient}
        onRefresh={fetchClients}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-red-600 mb-2">
               <div className="p-2 rounded-full bg-red-50">
                 <Trash2 size={24} />
               </div>
               <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete the client <span className="font-bold text-slate-900">{clientToDelete?.name}</span> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

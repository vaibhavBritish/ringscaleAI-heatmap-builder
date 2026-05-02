"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Building,
  ExternalLink,
  Loader2,
  Users,
  Layout
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
import { CompanyModal } from "@/components/admin/CompanyModal"
import { toast } from "sonner"
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

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1, limit: 10 })
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState(null)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/companies?page=${pagination.currentPage}&limit=${pagination.limit}&search=${search}`)
      const data = await res.json()
      if (data.companies) setCompanies(data.companies)
      if (data.pagination) setPagination(data.pagination)
    } catch (error) {
      console.error("Failed to fetch companies:", error)
      toast.error("Failed to load companies")
    } finally {
      setLoading(false)
    }
  }, [pagination.currentPage, pagination.limit, search])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCompanies()
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [fetchCompanies])

  const handleDelete = async () => {
    if (!companyToDelete) return
    try {
      const res = await fetch(`/api/admin/companies/${companyToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete company")
      toast.success("Company deleted successfully")
      fetchCompanies()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsDeleteOpen(false)
      setCompanyToDelete(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Partner Companies</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage franchises and partner companies across the platform.</p>
        </div>
        <Button 
          onClick={() => { setSelectedCompany(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus size={18} className="mr-2" /> Add Company
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="pb-3 px-6">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search by company name or slug..." 
                className="pl-10 h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-10 text-slate-600 dark:text-slate-300">
                <Filter size={16} className="mr-2" /> Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="w-[300px] px-6">Company</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead align="right" className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={7} className="h-16 px-6">
                      <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (companies?.length || 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Building size={48} className="opacity-20" />
                      <p className="font-medium">No companies found</p>
                      <p className="text-sm">Try adding your first partner company</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-slate-100 dark:border-slate-800">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold ring-1 ring-blue-200 dark:ring-blue-800">
                          {company.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{company.name}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{company.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400 font-bold">
                        {company.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      {company.isActive ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0 text-[10px] font-bold uppercase tracking-wider">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-2 py-0 text-[10px] font-bold uppercase tracking-wider">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Users size={14} className="text-slate-400" />
                        {company._count?.users || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Layout size={14} className="text-slate-400" />
                        {company._count?.projects || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800">
                             <MoreHorizontal size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => { setSelectedCompany(company); setIsModalOpen(true); }}>
                            <Pencil size={14} /> Edit Company
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer gap-2"
                            onClick={() => {
                              const domain = window.location.host.includes('localhost') ? 'localhost:3000' : 'ringscale.ai'
                              const protocol = window.location.protocol
                              const url = `${protocol}//${company.slug}.${domain}`
                              navigator.clipboard.writeText(url)
                              toast.success(`Link copied: ${url}`)
                            }}
                          >
                             <ExternalLink size={14} /> White-label Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                            onClick={() => { setCompanyToDelete(company); setIsDeleteOpen(true); }}
                          >
                            <Trash2 size={14} /> Delete Company
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 rounded-b-xl">
          <div className="text-xs font-medium text-slate-500">
            Showing <span className="text-slate-900 dark:text-slate-100">{(companies?.length || 0)}</span> of <span className="text-slate-900 dark:text-slate-100">{pagination?.total || 0}</span> companies
          </div>
          <div className="flex items-center gap-2">
            <Button 
               variant="outline" 
               size="sm" 
               disabled={(pagination?.currentPage || 1) === 1 || loading}
               onClick={() => setPagination({ ...pagination, currentPage: (pagination?.currentPage || 1) - 1 })}
               className="h-8 text-xs font-semibold"
            >
              <ChevronLeft size={16} className="mr-1" /> Previous
            </Button>
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center px-3 h-8 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300">
              {pagination?.currentPage || 1} / {pagination?.pages || 1}
            </div>
            <Button 
               variant="outline" 
               size="sm" 
               disabled={(pagination?.currentPage || 1) === (pagination?.pages || 1) || loading}
               onClick={() => setPagination({ ...pagination, currentPage: (pagination?.currentPage || 1) + 1 })}
               className="h-8 text-xs font-semibold"
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      <CompanyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        company={selectedCompany}
        onRefresh={fetchCompanies}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-red-600 mb-2">
               <div className="p-2 rounded-full bg-red-50 dark:bg-red-950/50">
                 <Trash2 size={24} />
               </div>
               <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              This will permanently delete the company <span className="font-bold text-slate-900 dark:text-slate-100">{companyToDelete?.name}</span> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

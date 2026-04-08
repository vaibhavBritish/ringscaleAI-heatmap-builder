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
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  ExternalLink,
  Loader2,
  Globe,
  Zap as ZapIcon,
  Package
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
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserModal } from "@/components/admin/UserModal"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1, limit: 10 })
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false)
  const [keywordUser, setKeywordUser] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?page=${pagination.currentPage}&limit=${pagination.limit}&search=${search}`)
      const data = await res.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [pagination.currentPage, pagination.limit, search])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers()
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [fetchUsers])

  const handleDelete = async () => {
    if (!userToDelete) return
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete user")
      toast.success("User deleted successfully")
      fetchUsers()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsDeleteOpen(false)
      setUserToDelete(null)
    }
  }

  const getPlanBadge = (plan) => {
    const plans = {
      Trial: "bg-slate-100 text-slate-700",
      advance: "bg-blue-100 text-blue-700",
      pro: "bg-blue-600 text-white",
      pro_plus: "bg-cyan-600 text-white"
    }
    return plans[plan] || "bg-slate-100 text-slate-700"
  }

  const getPlanName = (plan) => {
    const names = {
      Trial: "Trial",
      advance: "Advance",
      pro: "Pro",
      pro_plus: "Pro Plus"
    }
    return names[plan] || plan
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Users</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage platform users and their subscription plans.</p>
        </div>
        <Button 
          onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus size={18} className="mr-2" /> Add User
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="pb-3 px-6">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search by name or email..." 
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
                <TableHead className="w-[300px] px-6">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Credits</TableHead>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <User size={48} className="opacity-20" />
                      <p className="font-medium">No users found</p>
                      <p className="text-sm">Try adjusting your search</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-slate-100 dark:border-slate-800">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold ring-1 ring-blue-200 dark:ring-blue-800">
                          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{user.name || "N/A"}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.role === "admin" ? (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium text-xs">
                          <ShieldCheck size={14} /> Admin
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
                          <User size={14} /> User
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${getPlanBadge(user.plan)} border-none text-[10px] uppercase font-bold tracking-wider px-2`}>
                        {getPlanName(user.plan)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.fullKeywords?.length > 0 ? (
                        <div 
                          className="flex flex-col gap-1 max-w-[220px] cursor-pointer group"
                          onClick={() => { setKeywordUser(user); setIsKeywordModalOpen(true); }}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            <span className="truncate" title={user.keywordSummary}>{user.keywordSummary}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tight">
                              {user.keywordCount} Keywords
                            </span>
                            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[10px] text-slate-400 font-medium italic group-hover:underline">Click to view all</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No keywords</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                        {user.credits}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
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
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}>
                            <Pencil size={14} /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2">
                             <ExternalLink size={14} /> View Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                            onClick={() => { setUserToDelete(user); setIsDeleteOpen(true); }}
                          >
                            <Trash2 size={14} /> Delete User
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
            Showing <span className="text-slate-900 dark:text-slate-100">{users.length}</span> of <span className="text-slate-900 dark:text-slate-100">{pagination.total}</span> users
          </div>
          <div className="flex items-center gap-2">
            <Button 
               variant="outline" 
               size="sm" 
               disabled={pagination.currentPage === 1 || loading}
               onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
               className="h-8 text-xs font-semibold"
            >
              <ChevronLeft size={16} className="mr-1" /> Previous
            </Button>
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center px-3 h-8 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300">
              {pagination.currentPage} / {pagination.pages}
            </div>
            <Button 
               variant="outline" 
               size="sm" 
               disabled={pagination.currentPage === pagination.pages || loading}
               onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
               className="h-8 text-xs font-semibold"
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={selectedUser}
        onRefresh={fetchUsers}
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
              This will permanently delete the user <span className="font-bold text-slate-900 dark:text-slate-100">{userToDelete?.email}</span> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isKeywordModalOpen} onOpenChange={setIsKeywordModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Globe size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">User Keywords</DialogTitle>
                <p className="text-sm text-slate-500">{keywordUser?.email}</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 px-6 py-6 overflow-y-auto max-h-[500px]">
            {keywordUser?.fullKeywords?.length > 0 ? (
              <div className="space-y-8">
                {keywordUser.fullKeywords.map((project, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                       <div className="flex items-center gap-2">
                         <Package size={18} className="text-blue-500" />
                         <h3 className="font-bold text-slate-900 dark:text-slate-100">{project.businessName}</h3>
                       </div>
                       <Badge variant="secondary" className="text-[10px] font-bold">
                         {project.keywords.length} Keywords
                       </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {project.keywords.map((kw, kwIdx) => (
                        <div key={kwIdx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">{kw.text}</span>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-800 group-hover:border-blue-200 dark:group-hover:border-blue-900/50 shadow-sm">
                            <ZapIcon size={10} />
                            {kw.count} Scans
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Globe size={48} className="opacity-10 mb-4" />
                <p>No business keywords found for this user.</p>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button onClick={() => setIsKeywordModalOpen(false)} variant="outline">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

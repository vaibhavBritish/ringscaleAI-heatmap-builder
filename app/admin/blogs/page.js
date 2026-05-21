'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Search, MoreVertical, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/admin/blogs')
      if (res.ok) {
        const data = await res.json()
        setBlogs(data)
      } else {
        toast.error('Failed to load blogs')
      }
    } catch (error) {
      toast.error('An error occurred while fetching blogs')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog?')) return

    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Blog deleted successfully')
        setBlogs(blogs.filter(blog => blog.id !== id))
      } else {
        toast.error('Failed to delete blog')
      }
    } catch (error) {
      toast.error('An error occurred while deleting the blog')
    }
  }

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Blogs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your website's blog content</p>
        </div>
        
        <Link href="/admin/blogs/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> New Blog
          </Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Search blogs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading blogs...</td>
                </tr>
              ) : filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No blogs found. <Link href="/admin/blogs/new" className="text-blue-600 hover:underline">Create your first blog.</Link>
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{blog.title}</div>
                      <div className="text-xs text-slate-500">{blog.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {blog.author}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={blog.isPublished ? 'success' : 'secondary'} className={blog.isPublished ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-100'}>
                        {blog.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem asChild>
                            <Link href={`/blogs/${blog.slug}`} target="_blank" className="cursor-pointer gap-2">
                              <Eye className="w-4 h-4" /> View Live
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/blogs/${blog.id}`} className="cursor-pointer gap-2">
                              <Edit className="w-4 h-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
                            onClick={() => handleDelete(blog.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

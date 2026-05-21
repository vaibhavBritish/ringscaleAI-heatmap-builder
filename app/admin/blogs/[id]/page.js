'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    author: '',
    isPublished: false,
  })

  useEffect(() => {
    fetchBlog()
  }, [id])

  const fetchBlog = async () => {
    try {
      const res = await fetch(`/api/admin/blogs/${id}`)
      if (res.ok) {
        const data = await res.json()
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          coverImage: data.coverImage || '',
          author: data.author || '',
          isPublished: data.isPublished || false,
        })
      } else {
        toast.error('Failed to fetch blog details')
        router.push('/admin/blogs')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
  }

  const handleTitleChange = (e) => {
    const title = e.target.value
    setFormData({
      ...formData,
      title,
      // Only auto-update slug if we want to, let's keep it manual on edit to avoid breaking links
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success('Blog updated successfully')
        router.push('/admin/blogs')
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update blog')
      }
    } catch (error) {
      toast.error('An error occurred while updating the blog')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading blog details...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blogs">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit Blog</h1>
          <p className="text-sm text-slate-500">Make changes to your post.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8 space-y-8 shadow-sm">
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="Blog post title" 
                required 
                value={formData.title}
                onChange={handleTitleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug * (Changing this may break existing links)</Label>
              <Input 
                id="slug" 
                placeholder="blog-post-title" 
                required 
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author Name</Label>
              <Input 
                id="author" 
                placeholder="John Doe" 
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input 
                id="coverImage" 
                placeholder="https://example.com/image.jpg" 
                value={formData.coverImage}
                onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea 
              id="excerpt" 
              placeholder="A short summary of the blog post..." 
              className="resize-none h-20"
              value={formData.excerpt}
              onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content * (Supports Markdown / Plain Text)</Label>
            <Textarea 
              id="content" 
              placeholder="Write your amazing content here..." 
              className="min-h-[400px]"
              required
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <Switch 
              id="published" 
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({...formData, isPublished: checked})}
            />
            <Label htmlFor="published" className="cursor-pointer">Published</Label>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
          <Link href="/admin/blogs">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}

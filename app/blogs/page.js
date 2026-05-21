'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/blogs')
      if (res.ok) {
        const data = await res.json()
        setBlogs(data)
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 bg-white relative overflow-hidden">
        <div className="container mx-auto max-w-5xl relative z-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8">
            Insights & Updates
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 md:mb-8 leading-[1.1] tracking-tight">
            The Ringscale <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Journal</span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-500 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
            Latest news, local SEO strategies, case studies, and product updates straight from the team.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20 bg-slate-50 border-t border-slate-100 min-h-[50vh]">
        <div className="container mx-auto px-4 max-w-7xl">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-[2rem] border border-slate-100 h-96 animate-pulse"></div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">📝</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No posts yet</h2>
              <p className="text-slate-500">Check back later for new insights and updates.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Link key={blog.id} href={`/blogs/${blog.slug}`} className="group block">
                  <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 flex flex-col h-full">
                    {/* Cover Image */}
                    <div className="w-full h-64 bg-slate-100 relative overflow-hidden">
                      {blog.coverImage ? (
                        <img 
                          src={blog.coverImage} 
                          alt={blog.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-blue-600 to-blue-400">
                          <span className="text-white opacity-50 font-bold text-2xl">Ringscale AI</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </div>
                        {blog.author && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {blog.author}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      
                      <p className="text-slate-500 mb-8 flex-1 line-clamp-3">
                        {blog.excerpt || "Read more about this topic in the full post..."}
                      </p>
                      
                      <div className="mt-auto flex items-center text-blue-600 font-bold">
                        Read Article <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-2" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8">Ready to grow your local presence?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">Start tracking and optimizing your Google Business Profile today.</p>
          <Link href="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xl font-black px-12 py-8 shadow-2xl hover:scale-105 transition-transform">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

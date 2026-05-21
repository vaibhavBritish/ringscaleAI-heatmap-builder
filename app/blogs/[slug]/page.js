import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown' // Make sure this is installed or we use standard div

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const blog = await prisma.blog.findUnique({
    where: { slug: resolvedParams.slug }
  })
  if (!blog) return { title: 'Blog Not Found' }
  return {
    title: `${blog.title} | Ringscale AI`,
    description: blog.excerpt,
  }
}

export default async function SingleBlogPage({ params }) {
  const resolvedParams = await params;
  const blog = await prisma.blog.findUnique({
    where: { slug: resolvedParams.slug }
  })

  if (!blog || !blog.isPublished) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <article className="container mx-auto px-4 max-w-4xl">
          
          <div className="mb-12">
            <Link href="/blogs" className="inline-flex items-center text-blue-600 font-bold hover:text-blue-700 transition-colors mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to all posts
            </Link>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-500 uppercase tracking-wider pb-8 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                {new Date(blog.createdAt).toLocaleDateString()}
              </div>
              {blog.author && (
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-400" />
                  {blog.author}
                </div>
              )}
            </div>
          </div>

          {blog.coverImage && (
            <div className="w-full h-[400px] md:h-[500px] bg-slate-100 rounded-[2rem] overflow-hidden mb-12 shadow-lg">
              <img 
                src={blog.coverImage} 
                alt={blog.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-img:rounded-2xl">
            {/* If you add react-markdown later, you can use it here. For now, simple pre-wrap text or dangerouslySetInnerHTML if using a rich text editor */}
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
              <ReactMarkdown>
                {blog.content}
              </ReactMarkdown>
            </div>
          </div>

        </article>
      </main>

      {/* CTA Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-100 mt-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Enjoyed this post?</h2>
          <p className="text-lg text-slate-500 mb-8">
            Start implementing these strategies today with our powerful local SEO tracking tool.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full text-lg font-black px-10 py-6 shadow-xl hover:scale-105 transition-transform">
              Try Ringscale AI Free
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

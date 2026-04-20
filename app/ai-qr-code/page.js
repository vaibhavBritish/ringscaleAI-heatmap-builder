'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { QrCode, Sparkles, Zap, Shield, Rocket, ArrowRight, Check } from 'lucide-react'
import Image from 'next/image'

const styles = [
  { id: 'cyber', name: 'Cyberpunk', color: 'bg-blue-600' },
  { id: 'nature', name: 'Organic Nature', color: 'bg-emerald-500' },
  { id: 'minimal', name: 'Modern Minimal', color: 'bg-slate-900' },
  { id: 'glass', name: 'Glassmorphism', color: 'bg-purple-500' }
]

export default function AIQrCodePage() {
  const [url, setUrl] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('cyber')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = () => {
    if (!url) return
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-20">
          <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Revolutionizing QR Codes with AI
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
              Turn Boring QR Codes into <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent italic">
                Digital Masterpieces
              </span>
            </h1>
            <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto">
              Our advanced AI merges your brand aesthetic with functional QR codes. 
              Increase scan rates by up to 400% with beautiful, artistic designs.
            </p>
          </div>

          {/* Generator Demo UI */}
          <div className="max-w-5xl mx-auto mt-12 grid lg:grid-cols-2 gap-8 items-center">
            <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-10">
                <div className="space-y-8">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Destination Link</label>
                    <div className="relative">
                      <Input 
                        placeholder="https://your-brand.com" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="h-16 pl-6 pr-16 rounded-2xl border-slate-100 bg-slate-50 text-lg font-bold focus:ring-blue-500"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm">
                        <Zap className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">Select Art Style</label>
                    <div className="grid grid-cols-2 gap-3">
                      {styles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                            selectedStyle === style.id 
                            ? 'border-blue-600 bg-blue-50/50' 
                            : 'border-slate-50 bg-white hover:border-slate-200'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full ${style.color}`} />
                          <span className="text-sm font-bold text-slate-700">{style.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    onClick={handleGenerate}
                    disabled={isGenerating || !url}
                    className="w-full h-18 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-2xl text-xl font-black shadow-xl shadow-blue-200 transition-all active:scale-95"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating Art...
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        Generate AI QR Code <ArrowRight className="w-6 h-6" />
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Area */}
            <div className="relative aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-600/10 rounded-[3rem] blur-3xl animate-pulse" />
              <Card className="w-full max-w-[450px] relative z-10 border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white p-4 group">
                <div className="relative aspect-square rounded-[2rem] overflow-hidden">
                  <Image 
                    src="/ai_qr_code_demo.png" 
                    alt="AI QR Code Demo" 
                    fill
                    className={`object-cover transition-all duration-1000 ${isGenerating ? 'blur-xl scale-110' : 'blur-0 scale-100'}`}
                  />
                  {isGenerating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 text-white p-8 text-center">
                      <Sparkles className="w-12 h-12 mb-4 animate-bounce" />
                      <p className="text-xl font-black">AI is painting your code...</p>
                    </div>
                  )}
                </div>
                {!isGenerating && (
                   <div className="p-6 text-center">
                      <p className="text-slate-400 font-bold text-sm mb-1 uppercase tracking-widest">Preview Result</p>
                      <h3 className="text-xl font-black text-slate-800 italic">Style: {styles.find(s => s.id === selectedStyle).name}</h3>
                   </div>
                )}
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-4 py-20 border-t border-slate-100">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Zap, title: "400% Higher CTR", desc: "Artistic AI QR codes attract eye-balls and curiosity, significantly increasing engagement." },
              { icon: Shield, title: "Brand Safe", desc: "Fully functional codes that maintain your brand's visual identity without compromising scanability." },
              { icon: Rocket, title: "Instant Generation", desc: "Powered by custom-tuned Stable Diffusion models for lightning-fast results." }
            ].map((benefit, i) => (
              <div key={i} className="space-y-4">
                <div className="w-14 h-14 bg-blue-50 flex items-center justify-center rounded-2xl text-blue-600">
                  <benefit.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{benefit.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="bg-slate-900 rounded-[4rem] p-16 md:p-24 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] group-hover:bg-blue-600/30 transition-all duration-1000" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] group-hover:bg-purple-600/30 transition-all duration-1000" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
                Don't settle for <span className="text-blue-400">ugly black & white boxes</span>.
              </h2>
              <p className="text-xl text-slate-400 font-medium mb-12">
                Join 500+ premium brands that use Ringscale AI for their visual marketing needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="h-16 px-10 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-100 text-lg">
                  Start Free Trial
                </Button>
                <Button className="h-16 px-10 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 text-lg">
                  View Showcase
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

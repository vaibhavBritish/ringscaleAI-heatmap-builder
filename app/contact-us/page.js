'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import LeadForm from '@/components/LeadForm';

const ContactUsPage = () => {
  const [region, setRegion] = useState('intl'); // 'in' or 'intl'
  const [isAutoDetected, setIsAutoDetected] = useState(false);

  // Office Locations Data
  const offices = useMemo(() => ({
    in: {
      name: 'India Office',
      phone: '+91 91523 03009',
      address: 'P-10 Patel Nagar, New Delhi, 110008',
      mapUrl: 'https://maps.google.com/maps?q=P-10+Patel+Nagar,+New+Delhi,+110008&output=embed',
      timezone: 'Asia/Kolkata'
    },
    intl: {
      name: 'North America Office',
      phone: '+1 (437) 291-3099',
      address: '1470 Hurontario St, Mississauga, Ontario L5G 3H4',
      mapUrl: 'https://maps.google.com/maps?q=1470+Hurontario+St,+Mississauga,+Ontario+L5G+3H4&output=embed',
      timezone: 'America/Toronto'
    }
  }), []);

  // Detection Logic
  useEffect(() => {
    const detectRegion = () => {
      // 1. Check URL Path (High Priority)
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/in/') || path === '/in') return 'in';
        if (path.startsWith('/us/') || path === '/us' || path.startsWith('/ca/') || path === '/ca') return 'intl';
      }

      // 2. Check Timezone
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (userTz.includes('Calcutta') || userTz.includes('Kolkata') || userTz.includes('Asia/Kolkata')) return 'in';
      
      // 3. Check Browser Language
      if (navigator.language === 'en-IN' || (navigator.languages && navigator.languages.includes('en-IN'))) return 'in';

      return 'intl'; // Default
    };

    const initialRegion = detectRegion();
    setRegion(initialRegion);
    setIsAutoDetected(true);

    // 4. Async Browser Geolocation (Override if permitted)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          // Rough check for India bounds
          if (lat > 6 && lat < 38 && lon > 68 && lon < 98) {
            setRegion('in');
          } else {
            setRegion('intl');
          }
        },
        () => { /* Silent fallback to previous detection */ }
      );
    }
  }, []);

  const currentOffice = offices[region];

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-40 left-10 w-64 h-64 bg-blue-400 rounded-full blur-[120px]" />
          <div className="absolute bottom-40 right-10 w-96 h-96 bg-purple-400 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-hero-grid" />
        </div>

        <div className="relative pt-40 pb-20 px-4 md:px-12 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
              Let's <span className="text-blue-600">Connect</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Have questions about our SEO solutions or want to explore how we can help your business grow? We're just a message away.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Left Column: Contact Details & Info */}
            <div className="space-y-8">
              <div className="glass-panel p-8 rounded-3xl border-slate-200/60 transition-all hover:shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="w-6 h-6 text-blue-600 animate-pulse" />
                  <span className="text-sm font-semibold uppercase tracking-widest text-slate-500">Global Presence</span>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-3xl font-bold text-slate-900">{currentOffice.name}</h2>
                  {isAutoDetected && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-green-100 shadow-sm animate-in fade-in slide-in-from-right-2 duration-500">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Auto-detected
                    </span>
                  )}
                </div>
                <p className="text-slate-500 mb-8">Serving our clients from our nearest hub.</p>

                <div className="space-y-6">
                  <a href={`tel:${currentOffice.phone}`} className="flex items-center gap-4 group p-4 rounded-2xl hover:bg-blue-50 transition-colors">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</p>
                      <p className="text-lg font-medium text-slate-900">{currentOffice.phone}</p>
                    </div>
                  </a>

                  <a href="mailto:info@ringscale.ai" className="flex items-center gap-4 group p-4 rounded-2xl hover:bg-purple-50 transition-colors">
                    <div className="w-12 h-12 flex items-center justify-center bg-purple-100 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</p>
                      <p className="text-lg font-medium text-slate-900">info@ringscale.ai</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-4 group p-4 rounded-2xl">
                    <div className="w-12 h-12 flex items-center justify-center bg-orange-100 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</p>
                      <p className="text-lg font-medium text-slate-900">{currentOffice.address}</p>
                    </div>
                  </div>
                </div>

                {/* Region Toggle (Manual) */}
                <div className="mt-10 pt-8 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-400 mb-4">Switch location manually:</p>
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                    <button 
                      onClick={() => setRegion('in')}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${region === 'in' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      India
                    </button>
                    <button 
                      onClick={() => setRegion('intl')}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${region === 'intl' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      North America
                    </button>
                  </div>
                </div>
              </div>

              {/* Map Section */}
              <div className="relative group rounded-3xl overflow-hidden shadow-2xl bg-slate-200 aspect-video lg:aspect-[4/3] outline outline-1 outline-slate-200">
                <iframe
                  title="Office Location"
                  src={currentOffice.mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="transition-all duration-700"
                ></iframe>
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/40 shadow-lg pointer-events-none transition-opacity">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-red-500" /> Interactive Map
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Shared Lead Form */}
            <div className="lg:sticky lg:top-32">
              <LeadForm />
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default ContactUsPage;
'use client'

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Play, Star, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" suppressHydrationWarning={true}>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 bg-white relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Real Results, Real Growth
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 md:mb-8 leading-[1.1] tracking-tight">
            Don't Just Take Our Word For It. <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
              Hear From Our Partners.
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-500 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover how local businesses and agencies across the globe are securing top rankings and driving massive organic growth with Ringscale AI.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 pt-8 border-t border-slate-100 max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="flex text-yellow-400 mb-2">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="font-bold text-slate-800">4.9/5 on G2</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex text-yellow-400 mb-2">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="font-bold text-slate-800">4.8/5 on Trustpilot</p>
            </div>
            <div className="flex flex-col items-center">
              <h3 className="text-3xl font-black text-blue-600 mb-1">2,000+</h3>
              <p className="font-bold text-slate-800">Happy Clients</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Story */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-30"></div>
            <div className="relative z-10 md:w-1/3">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-slate-800 overflow-hidden mx-auto md:mx-0 shadow-2xl bg-slate-800 flex items-center justify-center">
                <span className="text-6xl">👨‍💼</span>
              </div>
            </div>
            <div className="relative z-10 md:w-2/3 text-center md:text-left">
              <Quote className="w-12 h-12 text-blue-500 opacity-50 mb-6 mx-auto md:mx-0" />
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-relaxed">
                "Ringscale AI didn't just give us data; it gave us a roadmap. We used the grid heatmaps to identify hyper-local gaps in our service areas, and within 4 months, our organic lead volume shot up by 215%."
              </h3>
              <div>
                <p className="text-xl font-black text-white">James Patterson</p>
                <p className="text-blue-400 font-medium">CEO, Apex Home Services</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Testimonials Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Video Testimonials</h2>
            <p className="text-xl text-slate-500">Watch our clients share their ranking transformation stories.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Generate 12 Video Placeholders */}
            {[
              "Agency Owner, New York", "Local Plumber, Texas", "Digital Marketer, Mumbai",
              "HVAC Business, Florida", "SEO Consultant, Bengaluru", "Dental Clinic, California",
              "Real Estate Agent, Delhi", "Roofing Contractor, Ohio", "Fitness Studio, London",
              "Law Firm, Chicago", "Restaurant Owner, Pune", "Auto Repair, Sydney"
            ].map((label, index) => (
              <div key={index} className="group relative rounded-3xl overflow-hidden bg-slate-200 aspect-[9/16] md:aspect-video shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex items-center justify-center border-4 border-white">
                <div className="absolute inset-0 bg-slate-800/20 group-hover:bg-slate-800/40 transition-colors"></div>
                <div className="relative z-10 w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                  <Play className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" />
                </div>
                <div className="absolute bottom-6 left-6 right-6 text-white z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <h3 className="text-xl font-bold mb-1 shadow-sm">Client Video {index + 1}</h3>
                  <p className="text-sm opacity-90 font-medium">{label} - Add your video here</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Written Testimonials Wall */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Wall of Love</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">See what the community is saying about our local SEO tracking and optimization platform.</p>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {[
              { name: "Rahul Sharma", role: "Founder, GrowthX SEO", location: "Mumbai, India", text: "We were struggling to show local clients why they weren't ranking outside their pincode. Ringscale AI's 13x13 grid made it completely visual. Showed it to a client, closed a ₹50,000/month retainer the next day." },
              { name: "Sarah Jenkins", role: "Agency Owner", location: "Austin, TX", text: "Ringscale AI completely changed how we report to clients. The heatmaps are intuitive, and the white-labeled reports make us look incredibly professional. We've closed 30% more retainers since using this tool!" },
              { name: "Priya Desai", role: "Local Bakery Owner", location: "Bengaluru, India", text: "Before this, I was invisible to anyone searching outside Indiranagar. The GBP management tools helped me optimize my posts daily. Now I get catering orders from Koramangala and HSR Layout effortlessly." },
              { name: "Michael Chang", role: "Local Plumber", location: "Seattle, WA", text: "I didn't understand SEO before this. Now I know exactly where I rank in my city and what I need to do to beat my competitors. Within 3 months, my call volume doubled." },
              { name: "Vikram Reddy", role: "Marketing Director", location: "Hyderabad, India", text: "Managing 15+ real estate projects across the city was a nightmare. The competitor gap analysis showed us exactly which keywords local brokers were dominating. We stole their traffic in under 6 weeks." },
              { name: "Elena Rodriguez", role: "Marketing Director", location: "Miami, FL", text: "The GBP management module alone is worth the price. Scheduling posts and managing multiple locations from one dashboard saves my team hours every week. Best investment we made this year." },
              { name: "Amit Patel", role: "Dental Clinic Chain Owner", location: "Ahmedabad, India", text: "We have 4 clinics. Using Ringscale's rank tracker, we identified that our satellite clinics weren't showing up for 'emergency dentist'. We adjusted our GBP strategy based on their insights, and emergency walk-ins increased by 40%." },
              { name: "David Thompson", role: "Franchise Manager", location: "Denver, CO", text: "Managing 50+ locations was a nightmare before Ringscale AI. The grid tracking lets us pinpoint exactly which locations need help and which ones are dominating." },
              { name: "Neha Gupta", role: "Freelance SEO Expert", location: "Delhi, India", text: "As a freelancer, keeping client costs low is crucial. The fact that unused credits roll over is a lifesaver. Plus, the automated white-label reports save me a full day of manual work every month." },
              { name: "Jessica Walsh", role: "SEO Specialist", location: "Chicago, IL", text: "The accuracy of the ranking data is unparalleled. I've tried other tools, but none provide the granular level of detail that Ringscale AI does. The competitor tracking is a game-changer." },
              { name: "Robert Lewis", role: "HVAC Business Owner", location: "Phoenix, AZ", text: "We dominate our service area now. Seeing the heatmap turn from red to green over 6 months was incredibly satisfying. My business has never been busier." },
              { name: "Suresh Iyer", role: "Auto Repair Shop Owner", location: "Chennai, India", text: "I'm not a tech guy. But seeing the red dots turn into green dots on the map makes sense to me. My garage is fully booked for the first time in 3 years." },
              { name: "Amanda Chen", role: "Digital Agency CEO", location: "Toronto, Canada", text: "Our clients love the visual reports. It's so much easier to explain the value of local SEO when you can literally show them a map of where they rank." },
              { name: "Arjun Singh", role: "Restaurant Owner", location: "Pune, India", text: "The competition for 'best biryani near me' is brutal. Ringscale AI showed me exactly which neighborhoods I was losing to my competitors. We ran targeted local ads in those specific red grids and won back the market." },
              { name: "Thomas Wright", role: "Lawyer", location: "New York, NY", text: "Local search is highly competitive for personal injury lawyers. Ringscale AI gave us the edge we needed. We're now consistently in the top 3 for our most profitable keywords." },
              { name: "Olivia Martin", role: "Restaurant Owner", location: "London, UK", text: "Since using the platform to manage our GBP posts and track our local rankings, we've seen a massive increase in foot traffic. The platform is super easy to use, even for a non-tech person." },
              { name: "Kiran Kumar", role: "Gym Owner", location: "Kochi, India", text: "We used to lose a lot of local traffic to the big gym chains. By focusing on hyper-local keywords suggested by the tool, we now rank #1 for 'fitness studio' within a 5km radius." },
              { name: "James Wilson", role: "Roofing Contractor", location: "Dallas, TX", text: "I used to pay an agency thousands a month for reports I didn't understand. Now I use Ringscale AI, manage it myself, and get better results. The ROI is incredible." },
              { name: "Pooja Verma", role: "Interior Designer", location: "Gurugram, India", text: "The visual heatmaps made it easy for me to see that I was only ranking in my immediate sector. I optimized my GBP profile based on Ringscale's tips, and now I'm getting inquiries from the whole city." },
              { name: "Sophia Taylor", role: "Marketing Freelancer", location: "Sydney, Australia", text: "This tool is a secret weapon. I use it for all my local clients and the results speak for themselves. The automated reporting saves me so much time at the end of the month." },
              { name: "Anil Deshmukh", role: "Pest Control Services", location: "Nagpur, India", text: "I tried 3 different tools before this. Ringscale AI is the fastest and most accurate. The competitor tracking feature helped me realize my rival was using 'termite control' better than me." },
              { name: "William Moore", role: "Dentist", location: "Atlanta, GA", text: "We opened a new practice and needed to build local visibility fast. Ringscale AI helped us identify the quick wins and track our progress as we climbed the ranks." },
              { name: "Divya N.", role: "Boutique Owner", location: "Chandigarh, India", text: "I love the scheduled GBP posting feature. I plan all my festival offers a month in advance, and Ringscale handles the rest. My store footfall has gone up noticeably!" },
              { name: "Marcus Johnson", role: "Landscaping", location: "Orlando, FL", text: "Being a service area business without a storefront makes SEO hard. Ringscale's grid lets us see our true visibility across all the zip codes we service." }
            ].map((testimonial, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 p-8 rounded-3xl break-inside-avoid shadow-sm hover:shadow-md transition-shadow">
                <div className="flex text-yellow-400 mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="text-slate-700 text-lg leading-relaxed mb-8 font-medium">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{testimonial.name}</h4>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                    <p className="text-xs text-slate-400 font-bold">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8">Ready to Write Your Own Success Story?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Join thousands of businesses globally already dominating their local markets.</p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-50 hover:text-blue-700 rounded-full text-xl font-black px-10 py-8 shadow-2xl hover:scale-105 transition-transform">
            Start Your Free Trial Today
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

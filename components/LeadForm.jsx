'use client';

import React, { useState } from 'react';
import { Send, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

const LeadForm = ({ defaultService = '', className = '' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    leadInterest: defaultService,
    consent: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.consent) {
      setError('You must agree to the Privacy Policy and Terms & Conditions.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        leadInterest: defaultService,
        consent: false,
      });
    } catch (err) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`glass-panel p-10 rounded-[2.5rem] border-slate-200/60 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 -mr-16 -mt-16 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Book a Product Demo</h3>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-bold text-slate-900">Message Received!</h4>
              <p className="text-slate-500">We've received your inquiry and will get back to you within 24 hours.</p>
            </div>
            <button 
              onClick={() => setSubmitted(false)}
              className="text-blue-600 font-semibold hover:underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-in slide-in-from-top-4 duration-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: John Doe"
                  required
                  className="w-full bg-slate-50 border-slate-100 px-4 py-3.5 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ex: john@company.com"
                  required
                  className="w-full bg-slate-50 border-slate-100 px-4 py-3.5 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ex: +1 (234) 567-890"
                  required
                  className="w-full bg-slate-50 border-slate-100 px-4 py-3.5 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Inquiry Type</label>
                <select
                  name="leadInterest"
                  value={formData.leadInterest}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50 border-slate-100 px-4 py-3.5 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none appearance-none font-medium"
                >
                <option value="">What are you interested in?</option>
                <option value="product">Product Inquiry</option>
                <option value="service">SEO Audit & Strategy</option>
                <option value="partnership">Partnership Opportunities</option>
                <option value="support">Technical Support</option>
                {defaultService && !['product', 'service', 'partnership', 'support'].includes(defaultService) && (
                  <option value={defaultService}>{defaultService}</option>
                )}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="How can we help you?"
                required
                rows={4}
                className="w-full bg-slate-50 border-slate-100 px-4 py-3.5 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none resize-none"
              />
            </div>

            <div className="flex items-start gap-3 py-2">
              <input
                type="checkbox"
                id="consent"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                className="mt-1 w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="consent" className="text-sm text-slate-500 leading-tight">
                I agree to the{' '}
                <a href="/privacy-policy" className="text-blue-600 font-semibold hover:underline">Privacy Policy</a>
                {' '}and{' '}
                <a href="/terms-conditions" className="text-blue-600 font-semibold hover:underline">Terms & Conditions</a>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-xl shadow-blue-200 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Message</span>
                  <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LeadForm;

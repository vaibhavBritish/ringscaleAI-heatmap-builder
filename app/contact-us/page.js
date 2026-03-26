'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    leadInterest: '',
    consent: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.consent) {
      setError('You must agree to the Privacy Policy and Terms & Conditions.');
      return;
    }
    setError('');
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setFormData({
      name: '',
      email: '',
      message: '',
      leadInterest: '',
      consent: false,
    });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-40 pb-12 px-4 md:px-12">
      <h1 className="text-4xl font-bold text-center mb-8">Contact Us</h1>

      <div className="grid md:grid-cols-2 gap-12 max-w-7xl mx-auto">
        {/* Contact Info & Map */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Get in Touch</h2>
          <p>We’d love to hear from you! Reach out via the contact form or the information below.</p>

          <div className="space-y-4">
            {(() => {
              if (typeof window === 'undefined') {
                return (
                  <>
                    <div>
                      <span className="font-medium">Phone:</span> <a href="tel:+14372913099" className="text-blue-600">+1 (437) 291-3099</a>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> <a href="mailto:info@ringscale.ai" className="text-blue-600">info@ringscale.ai</a>
                    </div>
                    <div>
                      <span className="font-medium">Address:</span> 1470 HurOntario St Mississauga Ontario L5G 3H4
                    </div>
                  </>
                );
              }

              // Priority 1: Check URL Path (Middle-ware driven)
              const path = window.location.pathname;
              const isIndiaPath = path.startsWith('/in/') || path === '/in';
              const isUsPath = path.startsWith('/us/') || path === '/us';
              
              // Priority 2: Check Timezone as fallback
              const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
              const isIndiaTz = userTz.includes('Calcutta') || userTz.includes('Kolkata') || userTz.includes('Asia/Kolkata');
              
              const isIndia = isIndiaPath ? true : isUsPath ? false : isIndiaTz;

              const contactInfo = isIndia ? {
                phone: "+91 91523 03009",
                address: "P-10 Patel Nagar, New Delhi, 110008"
              } : {
                phone: "+1 (437) 291-3099",
                address: "1470 HurOntario St Mississauga Ontario L5G 3H4"
              };

              return (
                <>
                  <div>
                    <span className="font-medium">Phone:</span> <a href={`tel:${contactInfo.phone.replace(/\s+/g, '')}`} className="text-blue-600">{contactInfo.phone}</a>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> <a href="mailto:info@ringscale.ai" className="text-blue-600">info@ringscale.ai</a>
                  </div>
                  <div>
                    <span className="font-medium">Address:</span> {contactInfo.address}
                  </div>
                </>
              );
            })()}
          </div>

          <div className="mt-6">
            <iframe
              title="Company Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.123456789!2d-122.419415!3d37.774929!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80858064e7b4e1f1%3A0x123456789abcdef!2sYour%20Company%20Location!5e0!3m2!1sen!2sus!4v1698263880000!5m2!1sen!2sus"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              className="rounded-md shadow-md"
            ></iframe>
          </div>
        </div>

        {/* Contact / Lead Form */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Send a Message</h2>

          {submitted && (
            <div className="mb-4 text-green-600 font-semibold">
              Thank you! Your form has been submitted.
            </div>
          )}

          {error && (
            <div className="mb-4 text-red-600 font-semibold">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
              required
              className="w-full border px-3 py-2 rounded-md"
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your Email"
              required
              className="w-full border px-3 py-2 rounded-md"
            />

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Your Message"
              required
              className="w-full border px-3 py-2 rounded-md"
            />

            <select
              name="leadInterest"
              value={formData.leadInterest}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded-md"
            >
              <option value="">Select an option</option>
              <option value="product">Product Inquiry</option>
              <option value="service">Service Inquiry</option>
              <option value="partnership">Partnership</option>
            </select>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm">
                I agree to the{' '}
                <a href="/privacy-policy" target="_blank" className="text-blue-600 underline">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/terms-conditions" target="_blank" className="text-blue-600 underline">
                  Terms & Conditions
                </a>.
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
    <Footer />
  </>
  );
};

export default ContactUsPage;
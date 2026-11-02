'use client'

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CATEGORIES = [
  'Restaurant/Cafe', 'Retail Store', 'Health/Medical', 'Real Estate', 
  'Home Services', 'Professional Services', 'Automotive', 'Beauty/Spa',
  'Education', 'Entertainment', 'Financial Services', 'Fitness',
  'Technology', 'Travel/Lodging', 'Other'
];

export default function BusinessProfileForm({ profile, project, onSave }) {
  const [autofilling, setAutofilling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: profile?.businessName || project?.businessName || '',
    address: profile?.address || project?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    country: profile?.country || 'India',
    phone: profile?.phone || '',
    website: profile?.website || '',
    category: profile?.category || '',
    description: profile?.description || ''
  });

  useEffect(() => {
    setFormData({
      businessName: profile?.businessName || project?.businessName || '',
      address: profile?.address || project?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      country: profile?.country || 'India',
      phone: profile?.phone || '',
      website: profile?.website || '',
      category: profile?.category || '',
      description: profile?.description || ''
    });
  }, [profile, project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const parseCityStateFromAddress = (address = '') => {
    const parts = address
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);

    // Typical map address formats are "... , City, State ZIP, Country"
    if (parts.length < 2) return { city: '', state: '' };

    const countryTokens = ['india', 'united states', 'usa', 'us', 'united kingdom', 'uk'];
    const withoutCountry = [...parts];
    const last = withoutCountry[withoutCountry.length - 1].toLowerCase();
    if (countryTokens.includes(last)) {
      withoutCountry.pop();
    }

    if (withoutCountry.length < 2) return { city: '', state: '' };

    const city = withoutCountry[withoutCountry.length - 2] || '';
    const stateSegment = withoutCountry[withoutCountry.length - 1] || '';
    const state = stateSegment.replace(/\b\d{4,}\b/g, '').trim();

    return { city, state };
  };

  const handleProjectAutofill = async () => {
    if (!project) return;

    setAutofilling(true);
    try {
      let placeDetails = null;
      if (project.placeId) {
        const placeRes = await fetch('/api/google/place-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeId: project.placeId }),
        });
        if (placeRes.ok) {
          placeDetails = await placeRes.json();
        }
      }

      const sourceAddress = project.address || placeDetails?.address || '';
      const parsedAddress = parseCityStateFromAddress(sourceAddress);

      setFormData({
        businessName: project.businessName || placeDetails?.name || '',
        address: sourceAddress,
        city: parsedAddress.city || '',
        state: parsedAddress.state || '',
        country: profile?.country || 'India',
        phone: placeDetails?.phone || '',
        website: placeDetails?.website || '',
        category: profile?.category || '',
        description: placeDetails?.summary || '',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to autofill from business details');
    } finally {
      setAutofilling(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/citations/profile?projectId=${encodeURIComponent(project.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to save profile');
      const data = await res.json();
      toast.success('Business profile saved successfully!');
      if (onSave) onSave(data.data);
    } catch (err) {
      toast.error(err.message || 'Failed to save business profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 p-3">
        <p className="text-sm text-muted-foreground">Fill phone, website and description from this business's Google listing.</p>
        <Button type="button" variant="outline" size="sm" onClick={handleProjectAutofill} disabled={!project || autofilling} className="shrink-0">
          {autofilling ? 'Autofilling...' : 'Autofill'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(val) => handleSelectChange('category', val)} required>
            <SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website (URL)</Label>
          <Input id="website" name="website" type="url" value={formData.website} onChange={handleChange} required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Street Address</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" value={formData.state} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={formData.country} onValueChange={(val) => handleSelectChange('country', val)} required>
            <SelectTrigger id="country"><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="India">India</SelectItem>
              <SelectItem value="United States">United States</SelectItem>
              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
              <SelectItem value="global">Global / Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Business Description</Label>
          <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required className="min-h-[100px]" />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}

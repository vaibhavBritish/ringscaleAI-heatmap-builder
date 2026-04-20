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

export default function BusinessProfileForm({ profile, onSave }) {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [autofilling, setAutofilling] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: profile?.businessName || '',
    address: profile?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    country: profile?.country || 'India',
    phone: profile?.phone || '',
    website: profile?.website || '',
    category: profile?.category || '',
    description: profile?.description || ''
  });

  useEffect(() => {
    let active = true;

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed to load projects');
        const data = await res.json();
        if (active) setProjects(data.projects || []);
      } catch (err) {
        toast.error('Failed to load projects for autofill');
      } finally {
        if (active) setLoadingProjects(false);
      }
    };

    fetchProjects();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setFormData({
      businessName: profile?.businessName || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      country: profile?.country || 'India',
      phone: profile?.phone || '',
      website: profile?.website || '',
      category: profile?.category || '',
      description: profile?.description || ''
    });
  }, [profile]);

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

  const handleProjectAutofill = async (projectId) => {
    setSelectedProjectId(projectId);
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    setAutofilling(true);
    try {
      // Fetch the selected project record (contains placeId) so we can refresh all fields.
      const projectRes = await fetch(`/api/projects/${projectId}`);
      if (!projectRes.ok) throw new Error('Failed to load selected project details');
      const projectPayload = await projectRes.json();
      const fullProject = projectPayload?.project || project;

      let placeDetails = null;
      if (fullProject?.placeId) {
        const placeRes = await fetch('/api/google/place-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeId: fullProject.placeId }),
        });
        if (placeRes.ok) {
          placeDetails = await placeRes.json();
        }
      }

      const sourceAddress = fullProject.address || placeDetails?.address || '';
      const parsedAddress = parseCityStateFromAddress(sourceAddress);

      setFormData({
        businessName: fullProject.businessName || placeDetails?.name || '',
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
      toast.error(err.message || 'Failed to autofill selected project');
    } finally {
      setAutofilling(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/citations/profile', {
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
      <div className="space-y-2">
        <Label htmlFor="projectAutofill">Project (Autofill)</Label>
        <Select value={selectedProjectId} onValueChange={handleProjectAutofill}>
          <SelectTrigger id="projectAutofill">
            <SelectValue placeholder={loadingProjects ? 'Loading projects...' : autofilling ? 'Autofilling profile...' : 'Select project to autofill profile'} />
          </SelectTrigger>
          <SelectContent>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.businessName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import BusinessProfileForm from './components/BusinessProfileForm';
import SubmitDrawer from './components/SubmitDrawer';

export default function CitationsPage() {
  const [profile, setProfile] = useState(null);
  const [directories, setDirectories] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [urlInputs, setUrlInputs] = useState({});
  
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, dirsRes, subsRes] = await Promise.all([
        fetch('/api/citations/profile'),
        fetch('/api/citations/directories'),
        fetch('/api/citations/submissions')
      ]);

      const pData = await profileRes.json();
      const dData = await dirsRes.json();
      const sData = await subsRes.json();

      setProfile(pData.data || null);
      setDirectories(dData.data || []);
      
      const subsMap = {};
      const urlMap = {};
      (sData.data || []).forEach(sub => {
        subsMap[sub.directoryId] = sub;
        urlMap[sub.directoryId] = sub.listingUrl || '';
      });
      setSubmissions(subsMap);
      setUrlInputs(urlMap);
    } catch (err) {
      toast.error('Failed to load citations data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = (updatedProfile) => {
    setProfile(updatedProfile);
    setProfileDialogOpen(false);
  };

  const handleStatusChange = async (directoryId, status) => {
    let sub = submissions[directoryId];
    if (!sub) {
      try {
        const res = await fetch('/api/citations/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ directoryId, status })
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSubmissions(prev => ({ ...prev, [directoryId]: data.data }));
        toast.success('Status updated');
      } catch (err) {
        toast.error('Failed to create submission');
      }
    } else {
      try {
        const res = await fetch(`/api/citations/submissions/${sub.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSubmissions(prev => ({ ...prev, [directoryId]: data.data }));
        toast.success(`Status changed to ${status.replace('_', ' ')}`);
      } catch (err) {
        toast.error('Failed to update status');
      }
    }
  };

  const handleUrlSave = async (directoryId) => {
    const sub = submissions[directoryId];
    const url = urlInputs[directoryId];
    if (!sub) {
      toast.error('Please update status first to create a submission object.');
      return;
    }
    try {
      const res = await fetch(`/api/citations/submissions/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingUrl: url })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSubmissions(prev => ({ ...prev, [directoryId]: data.data }));
      toast.success('Listing URL saved');
    } catch (err) {
      toast.error('Failed to save listing URL');
    }
  };

  const handleCheckBacklink = async (directoryId) => {
    const sub = submissions[directoryId];
    if (!sub?.id || !sub?.listingUrl) {
      toast.error('Cannot check backlink without saved listing URL');
      return;
    }
    toast.info('Checking for backlink...');
    try {
      const res = await fetch('/api/citations/backlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: sub.id, listingUrl: sub.listingUrl })
      });
      if (!res.ok) {
        const t = await res.json();
        throw new Error(t.error || 'Check failed');
      }
      const pData = await res.json();
      setSubmissions(prev => ({
        ...prev,
        [directoryId]: { 
          ...prev[directoryId], 
          backlinkFound: pData.data.backlinkFound, 
          linkType: pData.data.linkType 
        }
      }));
      if (pData.data.backlinkFound) {
        toast.success(`Backlink found! (${pData.data.linkType})`);
      } else {
        toast.warning('No backlink found');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to verify backlink');
    }
  };

  const handleAutoDiscover = async () => {
    if (!profile?.businessName || !profile?.website) {
      toast.error('Please complete Business Profile with business name and website first');
      return;
    }

    setDiscovering(true);
    toast.info('Discovering listing URLs using SerpApi...');
    try {
      const res = await fetch('/api/citations/discover', {
        method: 'POST',
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Auto discovery failed');
      }

      const updated = payload?.data?.updatedSubmissions || [];
      const possibleMatches = payload?.data?.possibleMatches || 0;
      if (!updated.length) {
        toast.warning(
          possibleMatches > 0
            ? `Found ${possibleMatches} likely SERP matches, but none were promoted to listing URLs.`
            : 'No listing URL candidates returned from SerpApi for this business.'
        );
        return;
      }

      setSubmissions((prev) => {
        const next = { ...prev };
        updated.forEach((sub) => {
          next[sub.directoryId] = sub;
        });
        return next;
      });
      setUrlInputs((prev) => {
        const next = { ...prev };
        updated.forEach((sub) => {
          next[sub.directoryId] = sub.listingUrl || '';
        });
        return next;
      });

      toast.success(
        `Discovered ${updated.length} listing URL${updated.length > 1 ? 's' : ''} (strict business match)`
      );
    } catch (err) {
      toast.error(err.message || 'Failed to auto-discover listing URLs');
    } finally {
      setDiscovering(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'verified': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading citations...</div>;

  const totalSubmissions = Object.values(submissions);
  const completedCount = totalSubmissions.filter(s => s.status === 'submitted' || s.status === 'verified').length;
  const verifiedCount = totalSubmissions.filter(s => s.status === 'verified').length;
  const backlinkCount = totalSubmissions.filter(s => s.backlinkFound).length;
  const totalDirs = directories.length;
  const progressPercent = totalDirs ? Math.round((completedCount / totalDirs) * 100) : 0;

  const filteredDirectories = directories.filter(dir => {
    let subStatus = submissions[dir.id]?.status || 'not_started';
    if (filterCountry !== 'All' && dir.country !== filterCountry) return false;
    if (filterStatus !== 'All' && subStatus !== filterStatus) return false;
    return true;
  });

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Citation Builder</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Distribute your business across {totalDirs} directories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>
              {profile ? 'Your business details are ready to be published.' : 'Please complete your business profile before submitting citations.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile ? (
              <div className="space-y-2">
                <p className="font-semibold text-lg">{profile.businessName}</p>
                <p className="text-sm text-muted-foreground">{profile.address}, {profile.city}, {profile.state} {profile.country}</p>
                <p className="text-sm text-muted-foreground">{profile.phone} • <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{profile.website}</a></p>
              </div>
            ) : (
              <p className="text-sm text-amber-600 font-medium">No profile data found.</p>
            )}
            <div className="mt-6">
              <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant={profile ? 'outline' : 'default'}>{profile ? 'Edit Profile' : 'Complete Profile'}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Business Profile Data</DialogTitle>
                  </DialogHeader>
                  <BusinessProfileForm profile={profile} onSave={handleProfileSave} />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Completion Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-3 mt-2">{progressPercent}%</div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-sm text-muted-foreground mt-3">{completedCount} of {totalDirs} directories submitted or verified</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Directories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDirs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completedCount - verifiedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Backlink</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backlinkCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-4 px-4 sm:px-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:space-y-0">
          <CardTitle className="text-lg">Citation Directories</CardTitle>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoDiscover}
              disabled={discovering || !profile}
              className="w-full sm:w-auto"
            >
              {discovering ? 'Discovering...' : 'Auto-discover URLs'}
            </Button>
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Countries</SelectItem>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <div className="p-0 overflow-x-auto hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Directory</TableHead>
                <TableHead>Metrics</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[220px]">Listing URL / Backlink</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDirectories.map(dir => {
                const sub = submissions[dir.id];
                const status = sub?.status || 'not_started';
                
                return (
                  <TableRow key={dir.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{dir.name}</span>
                        {dir.requiresManual && <span className="text-xs text-muted-foreground mt-0.5">Manual submission</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="font-mono text-xs shadow-sm">DA {dir.domainAuthority}</Badge>
                        <Badge variant="secondary" className="capitalize text-xs">{dir.country}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={status} 
                        onValueChange={(val) => handleStatusChange(dir.id, val)}
                      >
                        <SelectTrigger className={`w-[130px] h-8 text-xs font-semibold rounded border-0 ${getStatusColor(status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-2 max-w-[240px]">
                        <div className="flex w-full items-center space-x-2">
                          <Input 
                            type="url" 
                            className="h-8 text-xs px-2 shadow-sm" 
                            placeholder="e.g., directory.com/biz..." 
                            value={urlInputs[dir.id] ?? ''} 
                            onChange={(e) => setUrlInputs(prev => ({ ...prev, [dir.id]: e.target.value }))}
                          />
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground shrink-0 border shadow-sm" 
                            onClick={() => handleUrlSave(dir.id)}
                            disabled={(urlInputs[dir.id] || '') === (sub?.listingUrl || '')}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                        {sub?.backlinkFound === true && (
                          <div className="flex items-center text-xs text-green-600 font-medium">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Backlink: {sub.linkType?.toUpperCase() || 'FOUND'}
                          </div>
                        )}
                        {sub?.backlinkFound === false && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            No backlink detected
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 shadow-sm"
                        onClick={() => {
                          if (!profile) {
                            toast.error('Please complete your Business Profile first!');
                            return;
                          }
                          setSelectedDirectory(dir);
                          setDrawerOpen(true);
                        }}
                      >
                        Submit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 shadow-sm"
                        onClick={() => handleCheckBacklink(dir.id)}
                      >
                         Check Backlink
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredDirectories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground space-y-3">
                    {directories.length === 0 ? (
                      <div className="space-y-2">
                        <p>No citation directories are loaded.</p>
                        <p className="text-xs max-w-md mx-auto">
                          The API only returns directories that are not explicitly inactive. If you edited the database, ensure documents have{' '}
                          <code className="text-foreground">isActive</code> set to true (or re-run{' '}
                          <code className="text-foreground">node scripts/seed-directories.js</code>).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p>No rows match the current country or status filters.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilterCountry('All');
                            setFilterStatus('All');
                          }}
                        >
                          Reset filters to All
                        </Button>
                        <p className="text-xs max-w-md mx-auto">
                          Country on each directory must match the filter exactly (e.g.{' '}
                          <code className="text-foreground">India</code> or{' '}
                          <code className="text-foreground">global</code> in lowercase for Global).
                        </p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden p-3 space-y-3">
          {filteredDirectories.map((dir) => {
            const sub = submissions[dir.id];
            const status = sub?.status || 'not_started';

            return (
              <Card key={dir.id} className="border border-slate-200 shadow-sm">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{dir.name}</p>
                      {dir.requiresManual && (
                        <p className="text-xs text-muted-foreground mt-0.5">Manual submission</p>
                      )}
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] shrink-0">DA {dir.domainAuthority}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize text-[10px]">{dir.country}</Badge>
                    <Select value={status} onValueChange={(val) => handleStatusChange(dir.id, val)}>
                      <SelectTrigger className={`h-8 text-xs font-semibold rounded border-0 ${getStatusColor(status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="url"
                        className="h-8 text-xs px-2 shadow-sm"
                        placeholder="e.g., directory.com/biz..."
                        value={urlInputs[dir.id] ?? ''}
                        onChange={(e) => setUrlInputs(prev => ({ ...prev, [dir.id]: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground shrink-0 border shadow-sm"
                        onClick={() => handleUrlSave(dir.id)}
                        disabled={(urlInputs[dir.id] || '') === (sub?.listingUrl || '')}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                    {sub?.backlinkFound === true && (
                      <div className="flex items-center text-xs text-green-600 font-medium">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Backlink: {sub.linkType?.toUpperCase() || 'FOUND'}
                      </div>
                    )}
                    {sub?.backlinkFound === false && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        No backlink detected
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-9 shadow-sm"
                      onClick={() => {
                        if (!profile) {
                          toast.error('Please complete your Business Profile first!');
                          return;
                        }
                        setSelectedDirectory(dir);
                        setDrawerOpen(true);
                      }}
                    >
                      Submit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 shadow-sm"
                      onClick={() => handleCheckBacklink(dir.id)}
                    >
                      Check Backlink
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredDirectories.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground space-y-3">
                {directories.length === 0 ? (
                  <div className="space-y-2">
                    <p>No citation directories are loaded.</p>
                    <p className="text-xs max-w-md mx-auto">
                      The API only returns directories that are not explicitly inactive. If you edited the database, ensure documents have{' '}
                      <code className="text-foreground">isActive</code> set to true (or re-run{' '}
                      <code className="text-foreground">node scripts/seed-directories.js</code>).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p>No rows match the current country or status filters.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterCountry('All');
                        setFilterStatus('All');
                      }}
                    >
                      Reset filters to All
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </Card>

      <SubmitDrawer 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen} 
        directory={selectedDirectory} 
        profile={profile} 
        submission={selectedDirectory ? submissions[selectedDirectory.id] : null}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

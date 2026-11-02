'use client'

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Building2, MapPin, CheckCircle2, Send, Link2, AlertCircle, User, Plus, MoreHorizontal, ExternalLink, Pencil, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { PaginationBar } from '@/components/dashboard/PaginationBar';
import { toast } from 'sonner';

const PAGE_SIZE = 12;

export default function CitationsPage() {
  const [businesses, setBusinesses] = useState([]);
  const [totalDirectories, setTotalDirectories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [businessToReset, setBusinessToReset] = useState(null);
  const [resetting, setResetting] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await fetch('/api/citations/businesses');
      if (!res.ok) throw new Error('Failed to load businesses');
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setTotalDirectories(data.totalDirectories || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const handleReset = async () => {
    if (!businessToReset) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/citations/profile?projectId=${encodeURIComponent(businessToReset.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset citations');
      toast.success(`Citation progress reset for ${businessToReset.businessName}`);
      fetchBusinesses();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResetting(false);
      setBusinessToReset(null);
    }
  };

  const hasClientBusinesses = businesses.some(b => !b.isOwn);
  const term = search.trim().toLowerCase();
  const filteredBusinesses = businesses.filter(b => {
    const haystack = [b.businessName, b.address, b.owner?.name, b.owner?.email];
    if (term && !haystack.some(v => v?.toLowerCase().includes(term))) return false;
    if (filter === 'mine') return b.isOwn;
    if (filter === 'clients') return !b.isOwn;
    if (filter === 'no_profile') return !b.profile;
    if (filter === 'in_progress') return b.profile && b.stats.progress < 100;
    if (filter === 'complete') return b.stats.progress >= 100;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBusinesses.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedBusinesses = filteredBusinesses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totals = businesses.reduce((acc, b) => ({
    submitted: acc.submitted + b.stats.submitted,
    verified: acc.verified + b.stats.verified,
    backlinks: acc.backlinks + b.stats.backlinks,
  }), { submitted: 0, verified: 0, backlinks: 0 });

  const summaryCards = [
    { label: 'Businesses', value: businesses.length, icon: Building2, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Submitted', value: totals.submitted, icon: Send, tone: 'bg-indigo-50 text-indigo-600' },
    { label: 'Verified', value: totals.verified, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Backlinks', value: totals.backlinks, icon: Link2, tone: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Citation Builder</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Select a business to manage its citations across {totalDirectories} directories
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {summaryCards.map(card => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">{card.label}</p>
              <div className={`p-1.5 rounded-md ${card.tone}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '–' : card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder={hasClientBusinesses ? 'Search by business or client...' : 'Search businesses...'}
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Businesses</SelectItem>
            {hasClientBusinesses && <SelectItem value="mine">My Businesses</SelectItem>}
            {hasClientBusinesses && <SelectItem value="clients">Client Businesses</SelectItem>}
            <SelectItem value="no_profile">Profile Missing</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="complete">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <Card>
          <CardContent className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Building2 size={48} className="opacity-20" />
            {businesses.length === 0 ? (
              <>
                <p className="font-medium">No businesses yet</p>
                <p className="text-sm">Create a project for a business to start building its citations.</p>
                <Button asChild size="sm">
                  <Link href="/dashboard/projects/new"><Plus className="h-4 w-4 mr-1" /> New Project</Link>
                </Button>
              </>
            ) : (
              <p className="font-medium">No businesses match your search</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pagedBusinesses.map(business => (
              <BusinessCitationCard
                key={business.id}
                business={business}
                totalDirectories={totalDirectories}
                onReset={() => setBusinessToReset(business)}
              />
            ))}
          </div>
          <PaginationBar
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filteredBusinesses.length}
            onPageChange={setPage}
            itemLabel={filteredBusinesses.length === 1 ? 'business' : 'businesses'}
          />
        </div>
      )}

      <AlertDialog open={Boolean(businessToReset)} onOpenChange={(open) => !open && setBusinessToReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset citation progress?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the business profile and every directory status, listing URL and backlink check for{' '}
              <span className="font-semibold text-foreground">{businessToReset?.businessName}</span>. The business itself is not deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleReset(); }}
              disabled={resetting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {resetting ? 'Resetting...' : 'Reset Citations'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BusinessCitationCard({ business, totalDirectories, onReset }) {
  const router = useRouter();
  const { profile, stats, owner } = business;
  const location = profile ? [profile.city, profile.state].filter(Boolean).join(', ') : business.address;
  const href = `/dashboard/citations/${business.id}`;
  const hasProgress = Boolean(profile) || stats.inProgress + stats.completed > 0;

  return (
    <div className="group">
      <Card
        role="link"
        tabIndex={0}
        onClick={() => router.push(href)}
        onKeyDown={(e) => { if (e.key === 'Enter') router.push(href); }}
        className="h-full cursor-pointer transition-all group-hover:border-primary/40 group-hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardContent className="p-5 flex flex-col gap-4 h-full">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                {business.businessName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{profile?.businessName || business.businessName}</p>
                {location && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{location}</span>
                  </p>
                )}
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" aria-label={`Actions for ${business.businessName}`}>
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <Link href={href}><ExternalLink size={14} /> Open Citation Builder</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <Link href={`${href}?edit=profile`}><Pencil size={14} /> {profile ? 'Edit Business Profile' : 'Set Up Business Profile'}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                    disabled={!hasProgress}
                    onClick={onReset}
                  >
                    <RotateCcw size={14} /> Reset Citations
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {business.isOwn ? (
              <Badge variant="outline" className="text-[11px]">My business</Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] max-w-full">
                <User size={11} className="mr-1 shrink-0" />
                <span className="truncate">Client: {owner?.name || owner?.email || 'Unknown'}</span>
              </Badge>
            )}
            {!profile && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                <AlertCircle size={12} /> Profile not set up
              </span>
            )}
          </div>

          <div className="mt-auto space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{stats.completed} of {totalDirectories} directories</span>
              <span className="font-semibold">{stats.progress}%</span>
            </div>
            <Progress value={stats.progress} className="h-2" />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="secondary" className="text-[11px] bg-yellow-50 text-yellow-800">{stats.inProgress} in progress</Badge>
              <Badge variant="secondary" className="text-[11px] bg-blue-50 text-blue-700">{stats.submitted} submitted</Badge>
              <Badge variant="secondary" className="text-[11px] bg-green-50 text-green-700">{stats.verified} verified</Badge>
              <Badge variant="secondary" className="text-[11px] bg-slate-100 text-slate-700">{stats.backlinks} backlinks</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

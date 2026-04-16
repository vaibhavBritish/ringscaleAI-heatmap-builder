'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function RankTracker({ rankings = [] }) {
  if (rankings.length === 0) return (
    <div className="py-12 text-center border-2 border-dashed rounded-2xl text-slate-400">
      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-20" />
      <p>No keyword rankings tracked yet. Add keywords to start tracking.</p>
    </div>
  );

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-bold">Keyword</TableHead>
            <TableHead className="font-bold text-center">Rank</TableHead>
            <TableHead className="font-bold text-center">Best</TableHead>
            <TableHead className="font-bold">Target URL</TableHead>
            <TableHead className="font-bold text-right">Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map((rank) => (
            <TableRow key={rank.id}>
              <TableCell className="font-medium text-slate-900">{rank.keyword}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-lg font-black ${rank.rank && rank.rank <= 3 ? 'text-emerald-600' : rank.rank && rank.rank <= 10 ? 'text-blue-600' : 'text-slate-600'}`}>
                    {rank.rank || '-'}
                  </span>
                  {rank.rank && rank.rank <= 3 && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">TOP 3</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-center text-slate-400 text-sm font-medium">
                {rank.bestRank || '-'}
              </TableCell>
              <TableCell>
                {rank.url ? (
                  <a href={rank.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <span className="truncate max-w-[200px]">{rank.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic">Not in top 100</span>
                )}
              </TableCell>
              <TableCell className="text-right text-xs text-slate-500">
                {new Date(rank.updatedAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

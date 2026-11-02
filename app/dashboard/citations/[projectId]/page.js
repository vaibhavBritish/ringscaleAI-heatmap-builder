'use client'

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CitationWorkspace from '../components/CitationWorkspace';

export default function BusinessCitationsPage() {
  const { projectId } = useParams();
  const searchParams = useSearchParams();

  return (
    <CitationWorkspace
      projectId={projectId}
      openProfileOnLoad={searchParams.get('edit') === 'profile'}
      headerAction={
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href="/dashboard/citations">
            <ArrowLeft className="h-4 w-4 mr-1" /> All Businesses
          </Link>
        </Button>
      }
    />
  );
}

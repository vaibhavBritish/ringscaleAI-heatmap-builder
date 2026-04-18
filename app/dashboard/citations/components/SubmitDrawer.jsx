'use client'

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink, Copy, Check } from 'lucide-react';

export default function SubmitDrawer({ open, onOpenChange, directory, profile, submission, onStatusChange }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  if (!directory || !profile) return null;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    if (fieldName) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const copyAllText = `Business Name: ${profile.businessName}
Address: ${profile.address}
City: ${profile.city}
State: ${profile.state}
Country: ${profile.country}
Phone: ${profile.phone}
Website: ${profile.website}
Category: ${profile.category}

Description:
${profile.description}`;

  const ReadOnlyField = ({ label, value }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center space-x-2">
        {label === 'Description' ? (
          <Textarea readOnly value={value} className="resize-none h-24 text-sm" />
        ) : (
          <Input readOnly value={value} className="h-8 text-sm" />
        )}
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 shrink-0" 
          onClick={() => handleCopy(value, label)}
          title={`Copy ${label}`}
        >
          {copiedField === label ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Submit to {directory.name}</SheetTitle>
          <SheetDescription>
            Copy your business information below and paste it into the directory's submission form.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="flex flex-col space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => window.open(directory.submissionUrl, '_blank')}
            >
              Open Submission Page <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleCopy(copyAllText, null)}
            >
              {copiedAll ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
              {copiedAll ? 'Copied Everything!' : 'Copy All Info'}
            </Button>
          </div>

          <div className="space-y-4 py-2">
            <h3 className="font-medium text-sm">Your Business Profile</h3>
            <div className="grid gap-3">
              <ReadOnlyField label="Business Name" value={profile.businessName} />
              <ReadOnlyField label="Phone" value={profile.phone} />
              <ReadOnlyField label="Website" value={profile.website} />
              <ReadOnlyField label="Address" value={profile.address} />
              <ReadOnlyField label="City" value={profile.city} />
              <ReadOnlyField label="State" value={profile.state} />
              <ReadOnlyField label="Country" value={profile.country} />
              <ReadOnlyField label="Category" value={profile.category} />
              <ReadOnlyField label="Description" value={profile.description} />
            </div>
          </div>

          <div className="border-t pt-6 space-y-3 pb-8">
            <h3 className="font-medium text-sm">Update Status</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={submission?.status === 'in_progress' ? 'default' : 'outline'}
                onClick={() => {
                  onStatusChange(directory.id, 'in_progress');
                  onOpenChange(false);
                }}
              >
                Mark In Progress
              </Button>
              <Button 
                variant={submission?.status === 'submitted' ? 'default' : 'outline'}
                onClick={() => {
                  onStatusChange(directory.id, 'submitted');
                  onOpenChange(false);
                }}
              >
                Mark Submitted
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

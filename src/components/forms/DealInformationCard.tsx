
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Deal {
  id: string;
  deal_name: string;
  description?: string;
  related_lead_id?: string;
}

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  email?: string;
  phone_no?: string;
  position?: string;
  contact_owner?: string;
}

interface LeadOwner {
  id: string;
  full_name: string;
}

interface DealInformationCardProps {
  dealInfo: Deal;
  linkedLead: Lead | null;
  leadOwner: LeadOwner | null;
  editableDealTitle: string;
  editableLeadOwner: string;
  dealDescription: string;
  onTitleChange: (value: string) => void;
  onLeadOwnerChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

const DealInformationCard = ({
  dealInfo,
  linkedLead,
  leadOwner,
  editableDealTitle,
  editableLeadOwner,
  dealDescription,
  onTitleChange,
  onLeadOwnerChange,
  onDescriptionChange
}: DealInformationCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. Title - Editable */}
        <div>
          <Label htmlFor="deal_title">Title</Label>
          <Input
            id="deal_title"
            value={editableDealTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter deal title"
          />
        </div>

        {/* 2. Company Name - Read-only */}
        {linkedLead?.company_name && (
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={linkedLead.company_name}
              readOnly
              className="bg-gray-50"
            />
          </div>
        )}

        {/* 3. Current Lead Name - Read-only */}
        {linkedLead?.lead_name && (
          <div>
            <Label htmlFor="lead_name">Current Lead Name</Label>
            <Input
              id="lead_name"
              value={linkedLead.lead_name}
              readOnly
              className="bg-gray-50"
            />
          </div>
        )}

        {/* 4. Lead Owner - Editable */}
        <div>
          <Label htmlFor="lead_owner">Lead Owner</Label>
          <Input
            id="lead_owner"
            value={editableLeadOwner}
            onChange={(e) => onLeadOwnerChange(e.target.value)}
            placeholder="Enter lead owner name"
          />
        </div>

        {/* 5. Description - Editable */}
        <div>
          <Label htmlFor="deal_description">Description</Label>
          <Textarea
            id="deal_description"
            value={dealDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Enter deal notes, requirements, or additional details..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DealInformationCard;

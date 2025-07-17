import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, User, Users } from 'lucide-react';
import { Deal } from '@/hooks/useDeals';

interface LeadInformationSectionProps {
  deal: Deal;
}

export const LeadInformationSection = ({ deal }: LeadInformationSectionProps) => {
  // Use lead information directly from the deal object (set during import)
  const leadInfo = {
    company_name: deal.company_name,
    lead_name: deal.lead_name,
    lead_owner: deal.lead_owner,
    phone_no: deal.phone_no,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Building className="h-4 w-4" />
          Lead Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Company Name</Label>
            <div className="flex items-center gap-2">
              <Building className="h-3 w-3 text-gray-500" />
              <Input
                value={leadInfo.company_name || 'No Company'}
                readOnly
                className="bg-gray-50 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Lead Name</Label>
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-gray-500" />
              <Input
                value={leadInfo.lead_name || 'No Lead Name'}
                readOnly
                className="bg-gray-50 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Lead Owner</Label>
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-gray-500" />
              <Input
                value={leadInfo.lead_owner || 'No Owner'}
                readOnly
                className="bg-gray-50 text-sm"
              />
            </div>
          </div>

          {leadInfo.phone_no && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Phone</Label>
              <Input
                value={leadInfo.phone_no}
                readOnly
                className="bg-gray-50 text-sm"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
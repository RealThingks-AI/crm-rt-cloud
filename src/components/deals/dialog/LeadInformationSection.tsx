import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface LeadInformationSectionProps {
  defaultLead: any;
  leadOwner: any;
  meetingData: any;
}

export const LeadInformationSection = ({ defaultLead, leadOwner, meetingData }: LeadInformationSectionProps) => {
  if (defaultLead) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">
          {meetingData ? 'Related Lead Information' : 'Default Lead Information'}
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Lead Name</Label>
            <Input
              value={defaultLead.lead_name || ''}
              readOnly
              className="bg-white"
            />
          </div>
          
          {defaultLead.company_name && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Company Name</Label>
              <Input
                value={defaultLead.company_name}
                readOnly
                className="bg-white"
              />
            </div>
          )}
          
          {leadOwner && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Lead Owner</Label>
              <Input
                value={leadOwner.full_name}
                readOnly
                className="bg-white"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <p className="text-sm text-blue-700">
        No related lead found for meeting participants. The deal will be created using meeting information.
      </p>
    </div>
  );
};
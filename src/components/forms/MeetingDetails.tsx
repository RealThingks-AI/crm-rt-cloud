
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAJOR_TIMEZONES } from '@/utils/timezones';

interface MeetingDetailsProps {
  formData: {
    timezone: string;
  };
  onInputChange: (field: string, value: any) => void;
}

const MeetingDetails = ({ formData, onInputChange }: MeetingDetailsProps) => {
  return (
    <div>
      <Label htmlFor="timezone">Timezone</Label>
      <Select value={formData.timezone} onValueChange={(value) => onInputChange('timezone', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {MAJOR_TIMEZONES.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MeetingDetails;

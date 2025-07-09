
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MeetingDetailsProps {
  formData: {
    timezone: string;
  };
  onInputChange: (field: string, value: any) => void;
}

const MeetingDetails = ({ formData, onInputChange }: MeetingDetailsProps) => {
  const timezoneOptions = [
    { value: 'Asia/Kolkata', label: 'IST (India) - UTC+05:30' },
    { value: 'Europe/Berlin', label: 'GMT+2:00 (Germany) - UTC+02:00' },
    { value: 'Europe/Paris', label: 'Central European Time (CET) - UTC+01:00' }
  ];

  return (
    <div>
      <Label htmlFor="timezone">Timezone</Label>
      <Select value={formData.timezone} onValueChange={(value) => onInputChange('timezone', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          {timezoneOptions.map((option) => (
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

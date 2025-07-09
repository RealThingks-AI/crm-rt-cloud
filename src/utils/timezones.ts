
export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export const MAJOR_TIMEZONES: TimezoneOption[] = [
  { value: 'Pacific/Midway', label: '(-11:00 hours) Samoa Standard Time', offset: '-11:00' },
  { value: 'Pacific/Honolulu', label: '(-10:00 hours) Hawaii Standard Time', offset: '-10:00' },
  { value: 'America/Anchorage', label: '(-09:00 hours) Alaska Standard Time', offset: '-09:00' },
  { value: 'America/Los_Angeles', label: '(-08:00 hours) Pacific Standard Time', offset: '-08:00' },
  { value: 'America/Denver', label: '(-07:00 hours) Mountain Standard Time', offset: '-07:00' },
  { value: 'America/Chicago', label: '(-06:00 hours) Central Standard Time', offset: '-06:00' },
  { value: 'America/New_York', label: '(-05:00 hours) Eastern Standard Time', offset: '-05:00' },
  { value: 'America/Caracas', label: '(-04:00 hours) Venezuela Time', offset: '-04:00' },
  { value: 'America/Sao_Paulo', label: '(-03:00 hours) Brasilia Time', offset: '-03:00' },
  { value: 'Atlantic/South_Georgia', label: '(-02:00 hours) South Georgia Time', offset: '-02:00' },
  { value: 'Atlantic/Azores', label: '(-01:00 hours) Azores Time', offset: '-01:00' },
  { value: 'UTC', label: '(+00:00 hours) Coordinated Universal Time', offset: '+00:00' },
  { value: 'Europe/London', label: '(+00:00 hours) Greenwich Mean Time', offset: '+00:00' },
  { value: 'Europe/Berlin', label: '(+01:00 hours) Central European Time', offset: '+01:00' },
  { value: 'Europe/Paris', label: '(+01:00 hours) Central European Time', offset: '+01:00' },
  { value: 'Europe/Athens', label: '(+02:00 hours) Eastern European Time', offset: '+02:00' },
  { value: 'Africa/Cairo', label: '(+02:00 hours) Egypt Standard Time', offset: '+02:00' },
  { value: 'Europe/Moscow', label: '(+03:00 hours) Moscow Standard Time', offset: '+03:00' },
  { value: 'Asia/Dubai', label: '(+04:00 hours) Gulf Standard Time', offset: '+04:00' },
  { value: 'Asia/Kolkata', label: '(+05:30 hours) India Standard Time', offset: '+05:30' },
  { value: 'Asia/Dhaka', label: '(+06:00 hours) Bangladesh Standard Time', offset: '+06:00' },
  { value: 'Asia/Bangkok', label: '(+07:00 hours) Indochina Time', offset: '+07:00' },
  { value: 'Asia/Shanghai', label: '(+08:00 hours) China Standard Time', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: '(+09:00 hours) Japan Standard Time', offset: '+09:00' },
  { value: 'Australia/Sydney', label: '(+10:00 hours) Australian Eastern Time', offset: '+10:00' },
  { value: 'Pacific/Auckland', label: '(+12:00 hours) New Zealand Standard Time', offset: '+12:00' },
];

export const getUserTimezone = (): string => {
  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Check if user's timezone matches any of our major timezones
    const matchingTimezone = MAJOR_TIMEZONES.find(tz => tz.value === userTimezone);
    
    if (matchingTimezone) {
      return userTimezone;
    }
    
    // If no exact match, try to find a similar one based on offset
    const now = new Date();
    const userOffset = -now.getTimezoneOffset() / 60;
    
    // Find timezone with closest offset
    const closestTimezone = MAJOR_TIMEZONES.reduce((closest, tz) => {
      const tzOffset = parseFloat(tz.offset.replace(':', '.'));
      const currentOffset = parseFloat(closest.offset.replace(':', '.'));
      
      return Math.abs(tzOffset - userOffset) < Math.abs(currentOffset - userOffset) ? tz : closest;
    });
    
    return closestTimezone.value;
  } catch (error) {
    console.error('Error detecting user timezone:', error);
    // Default to UTC if detection fails
    return 'UTC';
  }
};

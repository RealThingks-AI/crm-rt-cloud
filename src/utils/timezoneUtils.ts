import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';
import { format as formatDate, addMinutes, isAfter } from 'date-fns';

// IANA timezone options for the form
export const IANA_TIMEZONES = [
  { label: 'Pacific/Honolulu (HST)', value: 'Pacific/Honolulu' },
  { label: 'America/Anchorage (AKST)', value: 'America/Anchorage' },
  { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'America/Denver (MST)', value: 'America/Denver' },
  { label: 'America/Chicago (CST)', value: 'America/Chicago' },
  { label: 'America/New_York (EST)', value: 'America/New_York' },
  { label: 'America/Halifax (AST)', value: 'America/Halifax' },
  { label: 'America/St_Johns (NST)', value: 'America/St_Johns' },
  { label: 'America/Sao_Paulo (BRT)', value: 'America/Sao_Paulo' },
  { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (CET)', value: 'Europe/Berlin' },
  { label: 'Europe/Moscow (MSK)', value: 'Europe/Moscow' },
  { label: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
  { label: 'Asia/Shanghai (CST)', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Australia/Sydney (AEDT)', value: 'Australia/Sydney' },
  { label: 'Pacific/Auckland (NZDT)', value: 'Pacific/Auckland' },
];

/**
 * Get the browser's IANA timezone
 */
export const getBrowserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert local date and time to UTC using IANA timezone
 */
export const convertLocalToUTC = (
  date: Date,
  time: string,
  timezone: string
): { utcStart: Date; utcEnd: Date } => {
  // Parse time string (HH:mm format)
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create local datetime in the specified timezone
  const localDateTime = new Date(date);
  localDateTime.setHours(hours, minutes, 0, 0);
  
  // Convert to UTC using date-fns-tz
  const utcStart = fromZonedTime(localDateTime, timezone);
  
  return {
    utcStart,
    utcEnd: utcStart // End will be calculated based on duration
  };
};

/**
 * Convert UTC datetime back to local timezone
 */
export const convertUTCToLocal = (
  utcDateTime: Date,
  timezone: string
): { localDate: Date; timeString: string } => {
  // Convert UTC to zoned time
  const localDateTime = toZonedTime(utcDateTime, timezone);
  
  // Extract date and time components
  const localDate = new Date(localDateTime.getFullYear(), localDateTime.getMonth(), localDateTime.getDate());
  const timeString = formatDate(localDateTime, 'HH:mm');
  
  return {
    localDate,
    timeString
  };
};

/**
 * Check if a local datetime is in the past
 */
export const isLocalDateTimeInPast = (
  date: Date,
  time: string,
  timezone: string
): boolean => {
  const { utcStart } = convertLocalToUTC(date, time, timezone);
  return !isAfter(utcStart, new Date());
};

/**
 * Format datetime with timezone info for display
 */
export const formatDateTimeWithTimezone = (
  utcDateTime: Date,
  timezone: string,
  duration: number
): string => {
  const { localDate, timeString } = convertUTCToLocal(utcDateTime, timezone);
  const endTime = toZonedTime(addMinutes(utcDateTime, duration), timezone);
  const endTimeString = formatDate(endTime, 'HH:mm');
  
  const formattedDate = formatDate(localDate, 'MMM dd, yyyy');
  const timezoneAbbr = format(utcDateTime, 'zzz', { timeZone: timezone });
  
  return `${formattedDate} · ${timeString} - ${endTimeString} (${timezoneAbbr})`;
};

/**
 * Get next available time slot (30-minute intervals)
 */
export const getNextAvailableTimeSlot = (
  date?: Date,
  timezone?: string
): string => {
  const now = new Date();
  const targetDate = date || now;
  const tz = timezone || getBrowserTimezone();
  
  // Convert current time to target timezone
  const localNow = toZonedTime(now, tz);
  const targetLocalDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const todayLocalDate = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  
  // If target date is today
  if (targetLocalDate.getTime() === todayLocalDate.getTime()) {
    const currentHour = localNow.getHours();
    const currentMinute = localNow.getMinutes();
    
    // Round up to next 30-minute interval
    let nextMinute = currentMinute < 30 ? 30 : 0;
    let nextHour = currentMinute < 30 ? currentHour : currentHour + 1;
    
    // Handle hour overflow
    if (nextHour >= 24) {
      nextHour = 9; // Start at 9 AM for next day
      nextMinute = 0;
    }
    
    return `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
  }
  
  // For future dates, start at 9:00 AM
  return "09:00";
};

/**
 * Generate time slots for a day (30-minute intervals)
 */
export const generateTimeSlots = (): string[] => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

/**
 * Get available time slots for a specific date and timezone
 */
export const getAvailableTimeSlots = (
  selectedDate: Date,
  timezone: string
): string[] => {
  const allSlots = generateTimeSlots();
  const now = new Date();
  const localNow = toZonedTime(now, timezone);
  const selectedLocalDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const todayLocalDate = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  
  // If selected date is today, filter out past slots
  if (selectedLocalDate.getTime() === todayLocalDate.getTime()) {
    return allSlots.filter(timeString => {
      return !isLocalDateTimeInPast(selectedDate, timeString, timezone);
    });
  }
  
  // For future dates, all slots are available
  return allSlots;
};

/**
 * Check for meeting conflicts in a time range
 */
export const checkMeetingConflicts = (
  meetings: any[],
  startTime: Date,
  endTime: Date,
  excludeMeetingId?: string
): boolean => {
  return meetings.some(meeting => {
    if (excludeMeetingId && meeting.id === excludeMeetingId) return false;
    
    const meetingStart = new Date(meeting.start_time_utc || meeting.start_datetime);
    const meetingEnd = new Date(meeting.end_time_utc || meeting.end_datetime);
    
    // Check for overlap
    return (startTime < meetingEnd && endTime > meetingStart);
  });
};

/**
 * Suggest next available slot after conflicts
 */
export const suggestNextAvailableSlot = (
  meetings: any[],
  preferredStart: Date,
  duration: number,
  timezone: string
): { date: Date; time: string } | null => {
  const localPreferred = toZonedTime(preferredStart, timezone);
  let currentSlot = new Date(localPreferred);
  
  // Try slots for next 7 days
  for (let day = 0; day < 7; day++) {
    const dayToCheck = new Date(currentSlot);
    dayToCheck.setDate(dayToCheck.getDate() + day);
    
    const availableSlots = getAvailableTimeSlots(dayToCheck, timezone);
    
    for (const timeSlot of availableSlots) {
      const { utcStart } = convertLocalToUTC(dayToCheck, timeSlot, timezone);
      const utcEnd = addMinutes(utcStart, duration);
      
      if (!checkMeetingConflicts(meetings, utcStart, utcEnd)) {
        return {
          date: dayToCheck,
          time: timeSlot
        };
      }
    }
  }
  
  return null;
};
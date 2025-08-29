
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CalendarIcon, Clock, Users, Globe, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  startDate: z.date({ required_error: 'Start date is required' }),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.string().min(1, 'Duration is required'),
  participant: z.string().min(1, 'Participant is required'),
  description: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingMeeting?: any;
}

// Generate time slots every 30 minutes
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

const durationOptions = [
  { label: '30 minutes', value: '30' },
  { label: '1 hour', value: '60' },
  { label: '1.5 hours', value: '90' },
  { label: '2 hours', value: '120' },
];

// Updated timezone options as requested
const timezones = [
  { label: 'UTC-10:00 (Hawaii-Aleutian Standard Time)', value: 'UTC-10:00' },
  { label: 'UTC-09:00 (Alaska Standard Time)', value: 'UTC-09:00' },
  { label: 'UTC-08:00 (Pacific Standard Time)', value: 'UTC-08:00' },
  { label: 'UTC-07:00 (Mountain Standard Time)', value: 'UTC-07:00' },
  { label: 'UTC-06:00 (Central Standard Time)', value: 'UTC-06:00' },
  { label: 'UTC-05:00 (Eastern Standard Time)', value: 'UTC-05:00' },
  { label: 'UTC-04:00 (Atlantic Standard Time)', value: 'UTC-04:00' },
  { label: 'UTC-03:30 (Newfoundland Standard Time)', value: 'UTC-03:30' },
  { label: 'UTC-03:00 (Argentina Time)', value: 'UTC-03:00' },
  { label: 'UTC-02:00 (Fernando de Noronha Time)', value: 'UTC-02:00' },
  { label: 'UTC-01:00 (Azores Standard Time)', value: 'UTC-01:00' },
  { label: 'UTC+00:00 (Greenwich Mean Time/Western European Time)', value: 'UTC+00:00' },
  { label: 'UTC+01:00 (Central European Time)', value: 'UTC+01:00' },
  { label: 'UTC+02:00 (Eastern European Time)', value: 'UTC+02:00' },
  { label: 'UTC+03:00 (Moscow Time)', value: 'UTC+03:00' },
  { label: 'UTC+03:30 (Iran Standard Time)', value: 'UTC+03:30' },
  { label: 'UTC+04:00 (Gulf Standard Time)', value: 'UTC+04:00' },
  { label: 'UTC+05:30 (Indian Standard Time)', value: 'UTC+05:30' },
  { label: 'UTC+06:30 (Myanmar Standard Time)', value: 'UTC+06:30' },
  { label: 'UTC+07:00 (Indochina Time)', value: 'UTC+07:00' },
  { label: 'UTC+08:00 (China Standard Time)', value: 'UTC+08:00' },
  { label: 'UTC+08:45 (Australian Central Western Standard Time)', value: 'UTC+08:45' },
  { label: 'UTC+09:00 (Japan Standard Time)', value: 'UTC+09:00' },
  { label: 'UTC+09:30 (Australian Central Standard Time)', value: 'UTC+09:30' },
  { label: 'UTC+10:00 (Australian Eastern Standard Time)', value: 'UTC+10:00' },
  { label: 'UTC+10:30 (Lord Howe Standard Time)', value: 'UTC+10:30' },
  { label: 'UTC+11:00 (Solomon Islands Time)', value: 'UTC+11:00' },
  { label: 'UTC+12:00 (Fiji Time)', value: 'UTC+12:00' },
];

// Get browser's actual timezone and return corresponding UTC offset value
const getBrowserTimezoneValue = () => {
  const offsetMinutes = -new Date().getTimezoneOffset(); // minutes ahead of UTC (positive for ahead)
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  return `UTC${sign}${hoursStr}:${minutesStr}`;
};

// Function to get timezone offset in minutes from UTC offset string
const getTimezoneOffsetMinutes = (timezoneValue: string) => {
  const match = timezoneValue.match(/UTC([+-])(\d{1,2}):?(\d{0,2})/);
  if (!match) return 0;
  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2]);
  const minutes = parseInt(match[3] || '0');
  return sign * (hours * 60 + minutes);
};

// Check if a specific date/time combination is in the past relative to browser's current time
const isDateTimeInPast = (date: Date, timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const selectedDateTime = new Date(date);
  selectedDateTime.setHours(hours, minutes, 0, 0);
  
  const now = new Date();
  return selectedDateTime <= now;
};

// Get next available time slot based on browser's current time
const getNextAvailableTimeSlot = (forDate?: Date) => {
  const now = new Date();
  const targetDate = forDate || now;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  // If it's today, start from current time + next 30-min slot
  if (selectedDay.getTime() === today.getTime()) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Round up to next 30-minute interval
    let nextMinute = currentMinute < 30 ? 30 : 0;
    let nextHour = currentMinute < 30 ? currentHour : currentHour + 1;
    
    // Handle hour overflow and next day
    if (nextHour >= 24) {
      nextHour = 9; // Start at 9 AM for next day
      nextMinute = 0;
    }
    
    return `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
  }
  
  // For future dates, start at 9:00 AM
  return "09:00";
};

// Get filtered available time slots based on selected date and timezone
const getAvailableTimeSlots = (selectedDate: Date, timezone: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  
  // If selected date is today, filter out past time slots
  if (selectedDay.getTime() === today.getTime()) {
    return timeSlots.filter(timeString => !isDateTimeInPast(selectedDate, timeString));
  }
  
  // If selected date is in the future, all slots are available
  return timeSlots;
};

// Synchronize form fields when timezone changes
const syncFieldsOnTimezoneChange = (form: any, newTimezone: string, currentDate: Date, currentTime: string) => {
  const availableSlots = getAvailableTimeSlots(currentDate, newTimezone);
  
  // If current time is no longer available in new timezone, pick next available
  if (!availableSlots.includes(currentTime)) {
    const nextSlot = availableSlots.length > 0 ? availableSlots[0] : getNextAvailableTimeSlot(currentDate);
    form.setValue('startTime', nextSlot);
  }
};

// Synchronize form fields when date changes
const syncFieldsOnDateChange = (form: any, newDate: Date, currentTimezone: string, currentTime: string) => {
  const availableSlots = getAvailableTimeSlots(newDate, currentTimezone);
  
  // If current time is no longer available for new date, pick next available
  if (!availableSlots.includes(currentTime)) {
    const nextSlot = availableSlots.length > 0 ? availableSlots[0] : getNextAvailableTimeSlot(newDate);
    form.setValue('startTime', nextSlot);
  }
};

// Convert local time to UTC using edge function
const convertToUTC = async (date: Date, timeString: string, timezoneValue: string, duration: number) => {
  const localDateTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${timeString}`;
  
  console.log('🔄 Converting local time to UTC via edge function:', {
    localDateTime,
    timezone: timezoneValue,
    duration
  });

  const { data, error } = await supabase.functions.invoke('convert-timezone', {
    body: {
      localDateTime,
      timezone: timezoneValue,
      duration,
      operation: 'toUTC'
    }
  });

  if (error) {
    console.error('❌ Timezone conversion error:', error);
    throw new Error(`Timezone conversion failed: ${error.message}`);
  }

  console.log('✅ Meeting Form - Final Timezone Conversion Summary:', {
    userInput: {
      date: date.toDateString(),
      time: timeString,
      timezone: timezoneValue,
      localDisplay: `${date.toDateString()} ${timeString} (${timezoneValue})`
    },
    conversion: {
      utcStart: data.utcStart,
      utcEnd: data.utcEnd,
      willStoreInDB: 'These UTC values',
      willSendToTeams: 'These same UTC values (no double conversion)'
    },
    expected: {
      supabaseStorage: data.utcStart,
      teamsDisplay: `Should show ${timeString} in user's timezone`,
      crmDisplay: `Should show ${timeString} ${timezoneValue}`
    }
  });

  return {
    utcStart: new Date(data.utcStart),
    utcEnd: new Date(data.utcEnd)
  };
};

// Convert UTC time from storage back to local timezone using edge function
const convertFromUTC = async (utcDate: Date, timezoneValue: string, duration: number) => {
  console.log('🔄 Converting UTC to local time via edge function:', {
    utcDateTime: utcDate.toISOString(),
    timezone: timezoneValue,
    duration
  });

  const { data, error } = await supabase.functions.invoke('convert-timezone', {
    body: {
      localDateTime: utcDate.toISOString(),
      timezone: timezoneValue,
      duration,
      operation: 'fromUTC'
    }
  });

  if (error) {
    console.error('❌ UTC to local conversion error:', error);
    throw new Error(`UTC to local conversion failed: ${error.message}`);
  }

  const localDate = new Date(data.localStart);
  
  console.log('✅ UTC to Local Conversion Result:', {
    utcInput: utcDate.toISOString(),
    localOutput: data.localStart,
    displayDate: localDate.toDateString(),
    displayTime: `${localDate.getHours().toString().padStart(2, '0')}:${localDate.getMinutes().toString().padStart(2, '0')}`,
    forFormPrefill: 'This will populate the form fields'
  });

  return {
    date: new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()),
    time: `${localDate.getHours().toString().padStart(2, '0')}:${localDate.getMinutes().toString().padStart(2, '0')}`
  };
};

// Legacy function for backward compatibility - now uses convertFromUTC
const formatTimeInTimezone = async (utcDate: Date, timezoneValue: string) => {
  const result = await convertFromUTC(utcDate, timezoneValue, 30); // Default 30 min duration for legacy usage
  return result.time;
};

export const MeetingForm = ({ open, onOpenChange, onSuccess, editingMeeting }: any) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [participantOpen, setParticipantOpen] = useState(false);

  const detectedTimezone = getBrowserTimezoneValue();

  const form = useForm<any>({
    resolver: zodResolver(meetingSchema as any),
    defaultValues: {
      title: '',
      timezone: detectedTimezone,
      startDate: new Date(),
      startTime: getNextAvailableTimeSlot(),
      duration: '30',
      participant: '',
      description: '',
    },
  });

  const watchedDate = form.watch('startDate');
  const watchedTime = form.watch('startTime');
  const watchedTimezone = form.watch('timezone');

  // Auto-detect and preset browser timezone, current date, and next available time slot

  // Fetch leads with status "New" for participants dropdown
  useEffect(() => {
    const fetchLeads = async () => {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, lead_name, email, company_name')
        .eq('lead_status', 'New')
        .not('email', 'is', null);
      if (!error && leads) setAvailableLeads(leads);
    };
    fetchLeads();
  }, []);

  // Pre-fill form with browser's timezone, current date, and next available time slot
  useEffect(() => {
    if (editingMeeting) {
      const handleEditingMeeting = async () => {
        console.log('📝 Editing Meeting - Loading stored UTC data:', {
          storedUTC: editingMeeting.start_datetime,
          storedTimezone: editingMeeting.timezone
        });

        const utcStartDate = new Date(editingMeeting.start_datetime);
        const utcEndDate = new Date(editingMeeting.end_datetime);
        const durationMinutes = Math.round((utcEndDate.getTime() - utcStartDate.getTime()) / (1000 * 60));
        const firstParticipant = editingMeeting.participants && editingMeeting.participants.length > 0 
          ? editingMeeting.participants[0] 
          : '';

        // Use browser's current timezone for editing (always display in user's current timezone)
        const browserTz = getBrowserTimezoneValue();
        
        try {
          // Convert UTC back to browser's local time for display using edge function
          const localDateTime = await convertFromUTC(utcStartDate, browserTz, durationMinutes);

          console.log('📝 Editing Meeting - Converted to local time for display:', {
            browserTimezone: browserTz,
            localDate: localDateTime.date.toDateString(),
            localTime: localDateTime.time,
            willDisplayAs: 'This is what user will see in form'
          });

          form.reset({
            title: editingMeeting.title,
            timezone: browserTz, // Always use browser timezone for editing
            startDate: localDateTime.date,
            startTime: localDateTime.time,
            duration: durationMinutes.toString(),
            participant: firstParticipant,
            description: editingMeeting.description || '',
          });
        } catch (error) {
          console.error('Failed to convert UTC to local time:', error);
          toast({
            title: "Error",
            description: "Failed to load meeting data",
            variant: "destructive",
          });
        }
      };
      
      handleEditingMeeting();
    } else {
      // For new meetings, preset with browser timezone, today's date, and next available slot
      const today = new Date();
      const nextSlot = getNextAvailableTimeSlot(today);
      
      console.log('📝 New Meeting - Browser timezone auto-preset:', {
        browserTimezone: detectedTimezone,
        todayDate: today.toDateString(),
        nextTimeSlot: nextSlot,
        note: 'User can change timezone if needed'
      });
      
      form.reset({
        title: '',
        timezone: detectedTimezone,
        startDate: today,
        startTime: nextSlot,
        duration: '30',
        participant: '',
        description: '',
      });
    }
  }, [editingMeeting, form, detectedTimezone]);

  // Synchronize fields when timezone changes
  useEffect(() => {
    if (watchedTimezone && watchedDate && !editingMeeting) {
      syncFieldsOnTimezoneChange(form, watchedTimezone, watchedDate, watchedTime);
    }
  }, [watchedTimezone]);

  // Synchronize fields when date changes
  useEffect(() => {
    if (watchedDate && watchedTimezone && !editingMeeting) {
      syncFieldsOnDateChange(form, watchedDate, watchedTimezone, watchedTime);
    }
  }, [watchedDate]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('📝 Meeting Form Submission - Raw Data:', {
        title: data.title,
        timezone: data.timezone,
        startDate: data.startDate,
        startTime: data.startTime,
        duration: data.duration,
        participant: data.participant,
        description: data.description
      });

      // Convert to UTC for storage and Teams meeting using edge function
      const durationMinutes = parseInt(data.duration);
      const { utcStart, utcEnd } = await convertToUTC(data.startDate, data.startTime, data.timezone, durationMinutes);
      
      const utcStartDateTime = utcStart;
      const utcEndDateTime = utcEnd;

      // Check if the selected time is in the past (using browser local time)
      if (isDateTimeInPast(data.startDate, data.startTime)) {
        toast({
          title: "Invalid Date",
          description: "Cannot schedule meetings in the past",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const selectedLead = availableLeads.find(l => l.id === data.participant);
      const participantEmail = selectedLead?.email || data.participant;
      const participantEmails = [participantEmail];

      let teamsResult;

      if (editingMeeting) {
        if (editingMeeting.teams_meeting_id) {
          teamsResult = await supabase.functions.invoke('create-teams-meeting', {
            body: {
              title: data.title,
              startDateTime: utcStartDateTime.toISOString(),
              endDateTime: utcEndDateTime.toISOString(),
              participants: participantEmails,
              description: data.description,
              teamsEventId: editingMeeting.teams_meeting_id,
            },
          });
          if (teamsResult.error) {
            console.error('Teams update error:', teamsResult.error);
          }
        }

        const { error: updateError } = await supabase
          .from('meetings')
          .update({
            title: data.title,
            start_datetime: utcStartDateTime.toISOString(),
            end_datetime: utcEndDateTime.toISOString(),
            participants: participantEmails,
            description: data.description,
            timezone: data.timezone,
            modified_by: user.id,
          })
          .eq('id', editingMeeting.id);
        if (updateError) throw updateError;

        toast({
          title: "Meeting Updated",
          description: "Meeting has been updated successfully",
        });
      } else {
        teamsResult = await supabase.functions.invoke('create-teams-meeting', {
          body: {
            title: data.title,
            startDateTime: utcStartDateTime.toISOString(),
            endDateTime: utcEndDateTime.toISOString(),
            participants: participantEmails,
            description: data.description,
          },
        });

        let teamsEventId = null;
        let teamsLink = null;

        if (teamsResult.data && !teamsResult.error) {
          teamsEventId = teamsResult.data.eventId;
          teamsLink = teamsResult.data.joinUrl || teamsResult.data.webLink;
        } else {
          console.error('Teams creation error:', teamsResult.error);
          toast({
            title: "Teams Integration Warning",
            description: "Meeting created but Teams link may not be available",
            variant: "destructive",
          });
        }

        const { error: insertError } = await supabase
          .from('meetings')
          .insert({
            title: data.title,
            start_datetime: utcStartDateTime.toISOString(),
            end_datetime: utcEndDateTime.toISOString(),
            participants: participantEmails,
            organizer: user.id,
            created_by: user.id,
            description: data.description,
            timezone: data.timezone,
            teams_meeting_id: teamsEventId,
            teams_meeting_link: teamsLink,
          });
        if (insertError) throw insertError;

        toast({
          title: "Meeting Created",
          description: "Meeting has been created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving meeting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save meeting",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {editingMeeting ? 'Edit Meeting' : 'Create New Meeting'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meeting title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Timezone * <span className="text-xs text-muted-foreground">(Auto-detected)</span>
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Trigger synchronization when timezone changes
                      if (watchedDate && !editingMeeting) {
                        syncFieldsOnTimezoneChange(form, value, watchedDate, watchedTime);
                      }
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60 z-50 bg-background">
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Start Date *
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            // Trigger synchronization when date changes
                            if (date && watchedTimezone && !editingMeeting) {
                              syncFieldsOnDateChange(form, date, watchedTimezone, watchedTime);
                            }
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Start Time * <span className="text-xs text-muted-foreground">(Synced with timezone & date)</span>
                  </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 z-50 bg-background">
                        {(() => {
                          const availableSlots = watchedDate ? getAvailableTimeSlots(watchedDate, watchedTimezone || detectedTimezone) : timeSlots;
                          return availableSlots.map((time) => {
                            const isPast = watchedDate && isDateTimeInPast(watchedDate, time);
                            return (
                              <SelectItem
                                key={time}
                                value={time}
                                disabled={!!isPast}
                                className={isPast ? "text-muted-foreground" : ""}
                              >
                                {time} {isPast ? "(Past)" : ""}
                              </SelectItem>
                            );
                          });
                        })()}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participant"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participant (Lead with Status = "New") *
                  </FormLabel>
                  <Popover open={participantOpen} onOpenChange={setParticipantOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value 
                            ? (() => {
                                const selectedLead = availableLeads.find(lead => lead.id === field.value);
                                return selectedLead ? selectedLead.lead_name : "Select participant";
                              })()
                            : "Select participant"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search participants..." />
                        <CommandList>
                          <CommandEmpty>No participants found.</CommandEmpty>
                          <CommandGroup>
                            {availableLeads.map((lead) => (
                              <CommandItem
                                key={lead.id}
                                onSelect={() => {
                                  field.onChange(lead.id);
                                  setParticipantOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === lead.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{lead.lead_name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {lead.email}
                                    {lead.company_name && ` - ${lead.company_name}`}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Meeting agenda or description" 
                      className="min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingMeeting ? 'Update Meeting' : 'Create Meeting'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

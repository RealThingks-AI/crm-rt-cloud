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
import { useAuth } from '@/hooks/useAuth';

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

// Get filtered available time slots based on selected date
const getAvailableTimeSlots = (selectedDate: Date) => {
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

export const MeetingForm = ({ open, onOpenChange, onSuccess, editingMeeting }: MeetingFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [openTimezone, setOpenTimezone] = useState(false);
  const [openTime, setOpenTime] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      timezone: getBrowserTimezoneValue(),
      startDate: new Date(),
      startTime: getNextAvailableTimeSlot(),
      duration: '30',
      participant: '',
      description: '',
    },
  });

  // Function to convert local datetime to UTC using edge function
  const convertToUTC = async (localDate: Date, localTime: string, timezone: string, duration: number) => {
    const [timeHours, timeMinutes] = localTime.split(':').map(Number);
    const localDateTime = new Date(localDate);
    localDateTime.setHours(timeHours, timeMinutes, 0, 0);
    
    // Format for edge function: "YYYY-MM-DD HH:mm"
    const localDateTimeString = localDateTime.toISOString().slice(0, 16).replace('T', ' ');
    
    console.log('🔄 Converting local time to UTC via edge function:', {
      localDateTime: localDateTimeString,
      timezone,
      duration
    });
    
    const { data, error } = await supabase.functions.invoke('convert-timezone', {
      body: {
        localDateTime: localDateTimeString,
        timezone,
        duration,
        operation: 'toUTC'
      }
    });
    
    if (error || !data.success) {
      throw new Error(data?.error || 'Failed to convert timezone');
    }
    
    return {
      utcStart: data.utcStart,
      utcEnd: data.utcEnd
    };
  };

  // Function to convert UTC back to local time for editing using edge function
  const convertFromUTC = async (utcDateTime: string, timezone: string, duration: number) => {
    console.log('🔄 Converting UTC to local time via edge function:', {
      utcDateTime,
      timezone,
      duration
    });
    
    const { data, error } = await supabase.functions.invoke('convert-timezone', {
      body: {
        localDateTime: utcDateTime, // UTC datetime string
        timezone,
        duration,
        operation: 'fromUTC'
      }
    });
    
    if (error || !data.success) {
      throw new Error(data?.error || 'Failed to convert from UTC');
    }
    
    const localDate = new Date(data.localStart);
    
    return {
      date: new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()),
      time: localDate.toTimeString().slice(0, 5) // HH:MM format
    };
  };

  // Auto-prefill defaults when opening form
  useEffect(() => {
    if (open && !editingMeeting) {
      const browserTimezone = getBrowserTimezoneValue();
      const today = new Date();
      const nextSlot = getNextAvailableTimeSlot(today);
      
      console.log('📝 New Meeting - Browser timezone auto-preset:', {
        browserTimezone: browserTimezone,
        todayDate: today.toDateString(),
        nextTimeSlot: nextSlot,
        note: 'User can change timezone if needed'
      });
      
      form.setValue('timezone', browserTimezone);
      form.setValue('startDate', today);
      form.setValue('startTime', nextSlot);
    }
  }, [open, editingMeeting, form]);

  // Populate form when editing
  useEffect(() => {
    if (editingMeeting && open) {
      const populateForm = async () => {
        try {
          // Convert UTC back to local time for display
          const duration = editingMeeting.duration || 30;
          const localDateTime = await convertFromUTC(editingMeeting.start_datetime, getBrowserTimezoneValue(), duration);
          
          console.log('📝 Editing Meeting - Populating form:', {
            meetingId: editingMeeting.id,
            storedUTC: editingMeeting.start_datetime,
            convertedToLocal: localDateTime,
            willShowInForm: 'User will see their original local time'
          });
          
          form.setValue('title', editingMeeting.title || '');
          form.setValue('startDate', localDateTime.date);
          form.setValue('startTime', localDateTime.time);
          form.setValue('timezone', getBrowserTimezoneValue());
          form.setValue('duration', duration.toString());
          form.setValue('participant', editingMeeting.participants?.[0] || '');
          form.setValue('description', editingMeeting.description || '');
        } catch (error) {
          console.error('Error populating form for editing:', error);
          toast({
            title: "Error",
            description: "Failed to load meeting data for editing",
            variant: "destructive",
          });
        }
      };
      
      populateForm();
    }
  }, [editingMeeting, open, form]);

  // Handle timezone change
  const handleTimezoneChange = (newTimezone: string) => {
    const currentDate = form.getValues('startDate');
    const currentTime = form.getValues('startTime');
    
    console.log('🔄 Timezone changed:', {
      from: form.getValues('timezone'),
      to: newTimezone,
      currentDate: currentDate.toDateString(),
      currentTime: currentTime
    });
    
    // Update timezone
    form.setValue('timezone', newTimezone);
    
    // Sync time slots for new timezone
    const availableSlots = getAvailableTimeSlots(currentDate);
    if (!availableSlots.includes(currentTime)) {
      const nextSlot = availableSlots.length > 0 ? availableSlots[0] : getNextAvailableTimeSlot(currentDate);
      form.setValue('startTime', nextSlot);
      
      console.log('🔄 Time adjusted for new timezone:', {
        oldTime: currentTime,
        newTime: nextSlot,
        reason: 'Previous time not available in new timezone context'
      });
    }
  };

  // Handle date change
  const handleDateChange = (newDate: Date) => {
    const currentTime = form.getValues('startTime');
    
    console.log('🔄 Date changed:', {
      from: form.getValues('startDate').toDateString(),
      to: newDate.toDateString(),
      currentTime: currentTime
    });
    
    // Update date
    form.setValue('startDate', newDate);
    
    // Sync time slots for new date
    const availableSlots = getAvailableTimeSlots(newDate);
    if (!availableSlots.includes(currentTime)) {
      const nextSlot = availableSlots.length > 0 ? availableSlots[0] : getNextAvailableTimeSlot(newDate);
      form.setValue('startTime', nextSlot);
      
      console.log('🔄 Time adjusted for new date:', {
        oldTime: currentTime,
        newTime: nextSlot,
        reason: 'Previous time not available for selected date'
      });
    }
  };

  const onSubmit = async (data: MeetingFormData) => {
    try {
      setSubmitting(true);
      
      // Validate that the meeting is not in the past
      if (isDateTimeInPast(data.startDate, data.startTime)) {
        toast({
          title: "Invalid Time",
          description: "Meeting cannot be scheduled in the past",
          variant: "destructive",
        });
        return;
      }

      console.log('📝 Meeting Form Submission - Raw Data:', data);

      // Convert local time to UTC using edge function
      const durationMinutes = parseInt(data.duration);
      const { utcStart, utcEnd } = await convertToUTC(data.startDate, data.startTime, data.timezone, durationMinutes);

      console.log('✅ Meeting Form - Final Timezone Conversion Summary:', {
        userInput: {
          date: data.startDate.toDateString(),
          time: data.startTime,
          timezone: data.timezone,
          localDisplay: `${data.startDate.toDateString()} ${data.startTime} (${data.timezone})`
        },
        conversion: {
          utcStart: utcStart,
          utcEnd: utcEnd,
          willStoreInDB: 'These UTC values',
          willSendToTeams: 'These same UTC values (no double conversion)'
        },
        expected: {
          supabaseStorage: utcStart,
          teamsDisplay: `Should show ${data.startTime} in user's timezone`,
          crmDisplay: `Should show ${data.startTime} ${data.timezone}`
        }
      });

      const participants = data.participant.split(',').map(p => p.trim()).filter(p => p);

      if (editingMeeting) {
        // Update existing meeting
        const { error: updateError } = await supabase
          .from('meetings')
          .update({
            title: data.title,
            start_datetime: utcStart,
            end_datetime: utcEnd,
            duration: durationMinutes,
            participants,
            description: data.description,
            modified_by: user?.id,
          })
          .eq('id', editingMeeting.id);

        if (updateError) throw updateError;

        // Update Teams meeting if it exists
        if (editingMeeting.teams_meeting_id) {
          console.log('Updating Teams meeting for:', editingMeeting.id);
          
          const { error: teamsError } = await supabase.functions.invoke('create-teams-meeting', {
            body: {
              title: data.title,
              startDateTime: utcStart,
              endDateTime: utcEnd,
              participants,
              description: data.description,
              teamsEventId: editingMeeting.teams_meeting_id,
            }
          });

          if (teamsError) {
            console.error('Teams update error:', teamsError);
            toast({
              title: "Warning",
              description: "Meeting updated locally but Teams event may not be synced",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Meeting Updated",
          description: "Meeting has been updated successfully",
        });
      } else {
        // Create new meeting
        const { data: meetingData, error: insertError } = await supabase
          .from('meetings')
          .insert({
            title: data.title,
            start_datetime: utcStart,
            end_datetime: utcEnd,
            duration: durationMinutes,
            participants,
            organizer: user?.id,
            created_by: user?.id,
            status: 'Scheduled',
            description: data.description,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Create Teams meeting
        console.log('Creating Teams meeting for:', meetingData.id);
        
        const { data: teamsResponse, error: teamsError } = await supabase.functions.invoke('create-teams-meeting', {
          body: {
            title: data.title,
            startDateTime: utcStart,
            endDateTime: utcEnd,
            participants,
            description: data.description,
          }
        });

        if (teamsError) {
          console.error('Teams creation error:', teamsError);
          toast({
            title: "Meeting Created",
            description: "Meeting created locally but Teams integration failed",
            variant: "destructive",
          });
        } else if (teamsResponse?.success) {
          // Update meeting with Teams information
          await supabase
            .from('meetings')
            .update({
              teams_meeting_id: teamsResponse.eventId,
              teams_meeting_link: teamsResponse.joinUrl,
            })
            .eq('id', meetingData.id);

          toast({
            title: "Meeting Created",
            description: "Meeting created successfully with Teams integration",
          });
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving meeting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save meeting",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get available time slots for selected date
  const watchedDate = form.watch('startDate');
  const availableTimeSlots = watchedDate ? getAvailableTimeSlots(watchedDate) : timeSlots;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meeting title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
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
                            if (date) {
                              field.onChange(date);
                              handleDateChange(date);
                            }
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Time */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Time</FormLabel>
                    <Popover open={openTime} onOpenChange={setOpenTime}>
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
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {field.value || "Select time"}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search time..." />
                          <CommandEmpty>No time found.</CommandEmpty>
                          <CommandGroup>
                            <CommandList className="max-h-[200px] overflow-y-auto">
                              {availableTimeSlots.map((time) => (
                                <CommandItem
                                  value={time}
                                  key={time}
                                  onSelect={() => {
                                    form.setValue('startTime', time);
                                    setOpenTime(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      time === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {time}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Timezone and Duration Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Timezone */}
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Timezone</FormLabel>
                    <Popover open={openTimezone} onOpenChange={setOpenTimezone}>
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
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <span className="truncate">
                                {field.value
                                  ? timezones.find((tz) => tz.value === field.value)?.label || field.value
                                  : "Select timezone"}
                              </span>
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search timezone..." />
                          <CommandEmpty>No timezone found.</CommandEmpty>
                          <CommandGroup>
                            <CommandList className="max-h-[200px] overflow-y-auto">
                              {timezones.map((timezone) => (
                                <CommandItem
                                  value={timezone.value}
                                  key={timezone.value}
                                  onSelect={(currentValue) => {
                                    const newTimezone = currentValue;
                                    field.onChange(newTimezone);
                                    handleTimezoneChange(newTimezone);
                                    setOpenTimezone(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      timezone.value === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {timezone.label}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
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
            </div>

            {/* Participants */}
            <FormField
              control={form.control}
              name="participant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participants
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter email addresses (comma separated)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter meeting agenda or description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingMeeting ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingMeeting ? 'Update Meeting' : 'Create Meeting'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
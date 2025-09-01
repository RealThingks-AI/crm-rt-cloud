import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addMinutes, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CalendarIcon, Clock, Users, Globe, Check, ChevronsUpDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  IANA_TIMEZONES,
  getBrowserTimezone,
  convertLocalToUTC,
  convertUTCToLocal,
  isLocalDateTimeInPast,
  getNextAvailableTimeSlot,
  getAvailableTimeSlots,
  checkMeetingConflicts,
  suggestNextAvailableSlot,
  formatDateTimeWithTimezone
} from '@/utils/timezoneUtils';

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

const durationOptions = [
  { label: '30 minutes', value: '30' },
  { label: '1 hour', value: '60' },
  { label: '1.5 hours', value: '90' },
  { label: '2 hours', value: '120' },
  { label: '3 hours', value: '180' },
];

export const MeetingForm = ({ open, onOpenChange, onSuccess, editingMeeting }: MeetingFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [participantOpen, setParticipantOpen] = useState(false);
  const [existingMeetings, setExistingMeetings] = useState<any[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [suggestedSlot, setSuggestedSlot] = useState<{ date: Date; time: string } | null>(null);

  const detectedTimezone = getBrowserTimezone();

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
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
  const watchedDuration = form.watch('duration');

  // Fetch existing meetings for conflict detection
  useEffect(() => {
    const fetchMeetings = async () => {
      const { data } = await supabase
        .from('meetings')
        .select('id, start_time_utc, end_time_utc, start_datetime, end_datetime, title')
        .eq('status', 'Scheduled');
      setExistingMeetings(data || []);
    };
    if (open) fetchMeetings();
  }, [open]);

  // Fetch leads for participants dropdown
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

  // Check for conflicts when time/date changes
  useEffect(() => {
    if (watchedDate && watchedTime && watchedTimezone && watchedDuration) {
      const duration = parseInt(watchedDuration);
      try {
        const { utcStart } = convertLocalToUTC(watchedDate, watchedTime, watchedTimezone);
        const utcEnd = addMinutes(utcStart, duration);
        
        const hasConflict = checkMeetingConflicts(
          existingMeetings,
          utcStart,
          utcEnd,
          editingMeeting?.id
        );
        
        if (hasConflict) {
          setConflictWarning('This time slot conflicts with an existing meeting.');
          const suggested = suggestNextAvailableSlot(existingMeetings, utcStart, duration, watchedTimezone);
          setSuggestedSlot(suggested);
        } else {
          setConflictWarning(null);
          setSuggestedSlot(null);
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    }
  }, [watchedDate, watchedTime, watchedTimezone, watchedDuration, existingMeetings, editingMeeting?.id]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingMeeting && open) {
      const handleEditingMeeting = async () => {
        try {
          // Use start_time_utc if available, fallback to start_datetime
          const utcStartDate = new Date(editingMeeting.start_time_utc || editingMeeting.start_datetime);
          const utcEndDate = new Date(editingMeeting.end_time_utc || editingMeeting.end_datetime);
          const duration = editingMeeting.duration || Math.round((utcEndDate.getTime() - utcStartDate.getTime()) / (1000 * 60));
          
          // Use stored timezone or browser timezone
          const timezone = editingMeeting.time_zone || detectedTimezone;
          
          // Convert back to local time
          const { localDate, timeString } = convertUTCToLocal(utcStartDate, timezone);
          
          const firstParticipant = editingMeeting.participants?.[0] || '';

          form.reset({
            title: editingMeeting.title,
            timezone,
            startDate: localDate,
            startTime: timeString,
            duration: duration.toString(),
            participant: firstParticipant,
            description: editingMeeting.description || '',
          });
        } catch (error) {
          console.error('Failed to load meeting data:', error);
          toast({
            title: "Error",
            description: "Failed to load meeting data",
            variant: "destructive",
          });
        }
      };
      
      handleEditingMeeting();
    } else if (!editingMeeting && open) {
      // Reset form for new meeting
      const today = new Date();
      const nextSlot = getNextAvailableTimeSlot(today, detectedTimezone);
      
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
  }, [editingMeeting, open, form, detectedTimezone, toast]);

  // Update available time slots when date/timezone changes
  useEffect(() => {
    if (watchedDate && watchedTimezone) {
      const availableSlots = getAvailableTimeSlots(watchedDate, watchedTimezone);
      if (!availableSlots.includes(watchedTime)) {
        const nextSlot = availableSlots[0] || getNextAvailableTimeSlot(watchedDate, watchedTimezone);
        form.setValue('startTime', nextSlot);
      }
    }
  }, [watchedDate, watchedTimezone, watchedTime, form]);

  const handleSuggestedSlotAccept = () => {
    if (suggestedSlot) {
      form.setValue('startDate', suggestedSlot.date);
      form.setValue('startTime', suggestedSlot.time);
      setConflictWarning(null);
      setSuggestedSlot(null);
    }
  };

  const onSubmit = async (data: MeetingFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate time is not in the past
      if (isLocalDateTimeInPast(data.startDate, data.startTime, data.timezone)) {
        toast({
          title: "Invalid Date",
          description: "Cannot schedule meetings in the past",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Convert to UTC for storage
      const duration = parseInt(data.duration);
      const { utcStart } = convertLocalToUTC(data.startDate, data.startTime, data.timezone);
      const utcEnd = addMinutes(utcStart, duration);

      // Check for conflicts one more time
      const hasConflict = checkMeetingConflicts(
        existingMeetings,
        utcStart,
        utcEnd,
        editingMeeting?.id
      );

      if (hasConflict && !conflictWarning) {
        toast({
          title: "Meeting Conflict",
          description: "This time slot conflicts with an existing meeting",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const selectedLead = availableLeads.find(l => l.id === data.participant);
      const participantEmail = selectedLead?.email || data.participant;
      const participantEmails = [participantEmail];

      // Prepare meeting data for database
      const meetingData = {
        title: data.title,
        description: data.description,
        start_time_utc: utcStart.toISOString(),
        end_time_utc: utcEnd.toISOString(),
        start_datetime: utcStart.toISOString(), // Keep for backward compatibility
        end_datetime: utcEnd.toISOString(), // Keep for backward compatibility
        time_zone: data.timezone,
        duration,
        participants: participantEmails,
        organizer: user.id,
        created_by: user.id,
        modified_by: user.id,
        status: 'Scheduled',
      };

      let meetingId: string;

      if (editingMeeting) {
        // Update existing meeting
        const { data: updatedMeeting, error } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', editingMeeting.id)
          .select()
          .single();

        if (error) throw error;
        meetingId = editingMeeting.id;

        // Update Teams meeting if it exists
        if (editingMeeting.microsoft_event_id || editingMeeting.teams_meeting_id) {
          try {
            await supabase.functions.invoke('create-teams-meeting', {
              body: {
                title: data.title,
                startDateTime: utcStart.toISOString(),
                endDateTime: utcEnd.toISOString(),
                participants: participantEmails,
                description: data.description,
                teamsEventId: editingMeeting.microsoft_event_id || editingMeeting.teams_meeting_id,
              },
            });
          } catch (teamsError) {
            console.error('Teams update failed:', teamsError);
            toast({
              title: "Warning",
              description: "Meeting updated but Teams sync failed",
              variant: "destructive",
            });
          }
        }
      } else {
        // Create new meeting
        const { data: newMeeting, error } = await supabase
          .from('meetings')
          .insert(meetingData)
          .select()
          .single();

        if (error) throw error;
        meetingId = newMeeting.id;

        // Create Teams meeting
        try {
          const { data: teamsResult, error: teamsError } = await supabase.functions.invoke('create-teams-meeting', {
            body: {
              title: data.title,
              startDateTime: utcStart.toISOString(),
              endDateTime: utcEnd.toISOString(),
              participants: participantEmails,
              description: data.description,
            },
          });

          if (!teamsError && teamsResult?.success) {
            // Update meeting with Teams info
            await supabase
              .from('meetings')
              .update({
                microsoft_event_id: teamsResult.eventId,
                teams_meeting_id: teamsResult.eventId,
                teams_meeting_link: teamsResult.joinUrl,
              })
              .eq('id', meetingId);
          }
        } catch (teamsError) {
          console.error('Teams creation failed:', teamsError);
          toast({
            title: "Warning",
            description: "Meeting created but Teams integration failed",
            variant: "destructive",
          });
        }
      }

      toast({
        title: editingMeeting ? "Meeting Updated" : "Meeting Created",
        description: editingMeeting 
          ? "Meeting has been updated successfully"
          : "Meeting has been created and synced with Teams",
      });

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

  const availableTimeSlots = watchedDate && watchedTimezone 
    ? getAvailableTimeSlots(watchedDate, watchedTimezone)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" aria-describedby="meeting-form-description">
        <DialogHeader>
          <DialogTitle>
            {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
          </DialogTitle>
        </DialogHeader>
        <div id="meeting-form-description" className="sr-only">
          {editingMeeting ? 'Edit meeting details' : 'Create a new meeting with timezone support'}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Meeting Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Meeting Title
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meeting title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Timezone Selection */}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Timezone
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px]">
                      {IANA_TIMEZONES.map((tz) => (
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

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date Selection */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Date
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
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Selection */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration Selection */}
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

            {/* Conflict Warning */}
            {conflictWarning && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  {conflictWarning}
                  {suggestedSlot && (
                    <div className="mt-2">
                      <p className="text-sm">
                        Suggested next available slot: {format(suggestedSlot.date, 'MMM dd')} at {suggestedSlot.time}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSuggestedSlotAccept}
                        className="mt-1"
                      >
                        Use suggested slot
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Participant Selection */}
            <FormField
              control={form.control}
              name="participant"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Participant</FormLabel>
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
                                const lead = availableLeads.find(l => l.id === field.value);
                                return lead ? `${lead.lead_name} (${lead.email})` : field.value;
                              })()
                            : "Select participant"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search participants..." />
                        <CommandEmpty>No participant found.</CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {availableLeads.map((lead) => (
                              <CommandItem
                                value={`${lead.lead_name} ${lead.email}`}
                                key={lead.id}
                                onSelect={() => {
                                  form.setValue("participant", lead.id);
                                  setParticipantOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    lead.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div>
                                  <div className="font-medium">{lead.lead_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {lead.email} • {lead.company_name}
                                  </div>
                                </div>
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

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter meeting description..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            {watchedDate && watchedTime && watchedTimezone && watchedDuration && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="text-sm font-medium">Meeting Preview:</div>
                <div className="text-sm text-muted-foreground">
                  {(() => {
                    try {
                      const duration = parseInt(watchedDuration);
                      const { utcStart } = convertLocalToUTC(watchedDate, watchedTime, watchedTimezone);
                      return formatDateTimeWithTimezone(utcStart, watchedTimezone, duration);
                    } catch {
                      return 'Invalid time selection';
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !!conflictWarning}>
                {isSubmitting ? 'Saving...' : editingMeeting ? 'Update Meeting' : 'Create Meeting'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
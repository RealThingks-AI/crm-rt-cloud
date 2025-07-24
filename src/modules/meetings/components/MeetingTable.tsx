import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/supabase/auth";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Badge } from "@/components/common/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/common/ui/dropdown-menu";
import { Plus, MoreHorizontal, Search, Calendar, Clock, Users, ExternalLink } from "lucide-react";
import { MeetingModal } from "./MeetingModal";
import { MeetingOutcomeModal } from "./MeetingOutcomeModal";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Meeting {
  id: string;
  meeting_title: string;
  date: string;
  start_time: string;
  duration: string;
  location: string;
  timezone: string;
  description: string;
  teams_link: string;
  participants: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Lead {
  id: string;
  lead_name: string;
}

export const MeetingTable = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMeetings();
    fetchLeads();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meetings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("id, lead_name")
        .order("lead_name");

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const handleDelete = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", meetingId);

      if (error) throw error;

      await fetchMeetings();
      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive",
      });
    }
  };

  const filteredMeetings = meetings.filter(meeting =>
    Object.values(meeting).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getParticipantNames = (participantIds: string[]) => {
    if (!participantIds || participantIds.length === 0) return "No participants";
    
    const names = participantIds.map(id => {
      const lead = leads.find(l => l.id === id);
      return lead ? lead.lead_name : "Unknown";
    });
    
    return names.join(", ");
  };

  const getMeetingStatus = (date: string, time: string) => {
    const meetingDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (meetingDateTime < now) {
      return { status: "Past", variant: "secondary" as const };
    } else if (meetingDateTime.toDateString() === now.toDateString()) {
      return { status: "Today", variant: "default" as const };
    } else {
      return { status: "Upcoming", variant: "outline" as const };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-96 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Button onClick={() => setIsMeetingModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meeting</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMeetings.map((meeting) => {
              const { status, variant } = getMeetingStatus(meeting.date, meeting.start_time);
              return (
                <TableRow key={meeting.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{meeting.meeting_title}</div>
                      {meeting.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {meeting.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {format(new Date(meeting.date), "MMM d, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {meeting.start_time} ({meeting.timezone})
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{meeting.duration}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{meeting.location}</span>
                      {meeting.teams_link && (
                        <a
                          href={meeting.teams_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[150px]">
                        {getParticipantNames(meeting.participants)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant}>{status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingMeeting(meeting);
                            setIsMeetingModalOpen(true);
                          }}
                        >
                          Edit Meeting
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMeetingId(meeting.id);
                            setIsOutcomeModalOpen(true);
                          }}
                        >
                          Add Outcome
                        </DropdownMenuItem>
                        {meeting.teams_link && (
                          <DropdownMenuItem
                            onClick={() => window.open(meeting.teams_link, "_blank")}
                          >
                            Join Meeting
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(meeting.id)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredMeetings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No meetings found matching your search." : "No meetings scheduled. Schedule your first meeting to get started."}
          </div>
        )}
      </div>

      {/* Modals */}
      <MeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => {
          setIsMeetingModalOpen(false);
          setEditingMeeting(null);
        }}
        meeting={editingMeeting}
        leads={leads}
        onSuccess={fetchMeetings}
      />

      <MeetingOutcomeModal
        isOpen={isOutcomeModalOpen}
        onClose={() => {
          setIsOutcomeModalOpen(false);
          setSelectedMeetingId(null);
        }}
        meetingId={selectedMeetingId}
        onSuccess={() => {
          // Refresh meetings if needed
          fetchMeetings();
        }}
      />
    </div>
  );
};
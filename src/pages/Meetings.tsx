
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Calendar, Clock, MapPin, Users, Search, Trash2, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import MeetingFormModal from '@/components/forms/MeetingFormModal';
import BulkActions from '@/components/BulkActions';
import ActionsDropdown from '@/components/ActionsDropdown';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useImportExport } from '@/hooks/useImportExport';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface Meeting {
  id: string;
  meeting_title: string;
  date: string;
  start_time: string;
  duration: '15 min' | '30 min' | '1 hour' | '2 hours';
  location: 'Online' | 'In-Person';
  timezone: string;
  participants: string[];
  teams_link?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const Meetings = () => {
  const location = useLocation();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLeadData, setInitialLeadData] = useState(null);

  // Check if we should open the add form with lead data
  useEffect(() => {
    if (location.state?.openAddForm) {
      setShowMeetingModal(true);
      setInitialLeadData(location.state.leadData);
    }
  }, [location.state]);

  const filteredMeetings = meetings.filter(meeting =>
    meeting.meeting_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    selectedItems,
    isAllSelected,
    toggleSelectAll,
    toggleSelectItem,
    clearSelection,
    hasSelection
  } = useBulkActions(filteredMeetings);

  const { handleImport, handleExportAll, handleExportSelected, handleExportFiltered } = useImportExport({
    moduleName: 'Meetings',
    onRefresh: fetchMeetings,
    tableName: 'meetings'
  });

  async function fetchMeetings() {
    try {
      console.log('Fetching meetings from Supabase...');
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching meetings:', error);
        throw error;
      }

      console.log('Fetched meetings:', data?.length || 0, 'records');
      const typedMeetings: Meeting[] = (data || []).map(meeting => ({
        ...meeting,
        participants: meeting.participants || [],
        duration: meeting.duration as '15 min' | '30 min' | '1 hour' | '2 hours',
        location: meeting.location as 'Online' | 'In-Person',
      }));
      setMeetings(typedMeetings);
    } catch (error: any) {
      console.error('Error in fetchMeetings:', error);
      toast({
        variant: "destructive",
        title: "Error fetching meetings",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleEditMeeting = (meeting: Meeting) => {
    console.log('Opening edit modal for meeting:', meeting.id);
    setSelectedMeeting(meeting);
    setShowMeetingModal(true);
  };

  const handleMeetingSuccess = () => {
    console.log('Meeting operation completed successfully');
    setShowMeetingModal(false);
    setSelectedMeeting(null);
    setInitialLeadData(null);
    fetchMeetings();
    toast({
      title: "Success",
      description: selectedMeeting ? "Meeting updated successfully" : "Meeting created successfully",
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      console.log('Bulk deleting meetings with IDs:', ids);
      const { error } = await supabase
        .from('meetings')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error in bulk delete:', error);
        throw error;
      }

      toast({
        title: "Meetings deleted",
        description: `Successfully deleted ${ids.length} meeting(s)`,
      });

      clearSelection();
      fetchMeetings();
    } catch (error: any) {
      console.error('Error in handleBulkDelete:', error);
      toast({
        variant: "destructive",
        title: "Error deleting meetings",
        description: error.message,
      });
    }
  };

  const handleBulkUpdateOwner = async (ids: string[], ownerId: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ created_by: ownerId })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: "Owner updated",
        description: `Successfully updated owner for ${ids.length} meeting(s)`,
      });

      clearSelection();
      fetchMeetings();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating owner",
        description: error.message,
      });
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      console.log('Attempting to delete meeting with ID:', meetingId);
      
      // Ensure we have a valid meeting ID
      if (!meetingId || typeof meetingId !== 'string') {
        console.error('Invalid meeting ID:', meetingId);
        toast({
          variant: "destructive",
          title: "Error deleting meeting",
          description: "Invalid meeting ID provided",
        });
        return;
      }

      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Meeting deleted successfully, ID:', meetingId);
      toast({
        title: "Meeting deleted",
        description: "Meeting has been successfully deleted",
      });

      // Refresh the meetings list
      fetchMeetings();
    } catch (error: any) {
      console.error('Error in handleDeleteMeeting:', error);
      toast({
        variant: "destructive",
        title: "Error deleting meeting",
        description: error.message || "An unexpected error occurred while deleting the meeting",
      });
    }
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = `${date}T${time}`;
      return format(new Date(dateTime), 'PPp');
    } catch {
      return `${date} ${time}`;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 mt-2">Schedule and manage your meetings</p>
        </div>
        <div className="flex space-x-2">
          <ActionsDropdown
            onImport={handleImport}
            onExportAll={() => handleExportAll(meetings, 'meetings')}
            onExportSelected={() => handleExportSelected(meetings, selectedItems, 'meetings')}
            onExportFiltered={() => handleExportFiltered(filteredMeetings, 'meetings')}
            onBulkDelete={handleBulkDelete}
            onBulkUpdateOwner={handleBulkUpdateOwner}
            hasSelected={hasSelection}
            hasFiltered={searchTerm.length > 0}
            selectedItems={selectedItems}
            moduleName="Meetings"
          />
          <Button onClick={() => setShowMeetingModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search meetings by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="mb-4">
        <BulkActions
          selectedItems={selectedItems}
          onSelectAll={toggleSelectAll}
          onDelete={handleBulkDelete}
          onChangeOwner={handleBulkUpdateOwner}
          isAllSelected={isAllSelected}
          totalItems={filteredMeetings.length}
          ownerOptions={[
            { value: 'user1', label: 'John Doe' },
            { value: 'user2', label: 'Jane Smith' }
          ]}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Meetings</p>
                <p className="text-xl font-semibold">{meetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-xl font-semibold">
                  {meetings.filter(m => new Date(`${m.date}T${m.start_time}`) > new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {filteredMeetings.map((meeting) => (
          <Card key={meeting.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedItems.includes(meeting.id)}
                    onCheckedChange={() => toggleSelectItem(meeting.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{meeting.meeting_title}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {meeting.location}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditMeeting(meeting)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{meeting.meeting_title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  console.log('Delete button clicked for meeting:', meeting.id, meeting.meeting_title);
                                  handleDeleteMeeting(meeting.id);
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatDateTime(meeting.date, meeting.start_time)}</span>
                        <span className="mx-2">•</span>
                        <span>{meeting.duration}</span>
                      </div>

                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{meeting.location}</span>
                        <span className="mx-2">•</span>
                        <span>{meeting.timezone}</span>
                      </div>

                      {meeting.participants && meeting.participants.length > 0 && (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{meeting.participants.length} participants</span>
                        </div>
                      )}
                    </div>

                    {meeting.teams_link && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-700 mb-1">Teams Meeting:</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(meeting.teams_link, '_blank')}
                        >
                          Join Meeting
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredMeetings.length === 0 && meetings.length > 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search terms.
              </p>
            </CardContent>
          </Card>
        )}

        {meetings.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings scheduled</h3>
              <p className="text-gray-600 mb-4">
                Start by scheduling your first meeting.
              </p>
              <Button onClick={() => setShowMeetingModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showMeetingModal} onOpenChange={setShowMeetingModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}</DialogTitle>
          </DialogHeader>
          <MeetingFormModal
            meeting={selectedMeeting}
            onSuccess={handleMeetingSuccess}
            onCancel={() => {
              setShowMeetingModal(false);
              setSelectedMeeting(null);
              setInitialLeadData(null);
            }}
            initialLeadData={initialLeadData}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Meetings;

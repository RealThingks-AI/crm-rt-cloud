import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/ui/card";
import { Badge } from "@/components/common/ui/badge";
import { Button } from "@/components/common/ui/button";
import { Activity, User, BarChart3, Calendar, Mail, Phone, FileText, Filter } from "lucide-react";

const Feeds = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Activity Feeds</h1>
          <p className="text-muted-foreground">Track all business activities and updates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            Export
          </Button>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">142</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Deal Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">18</p>
                <p className="text-sm text-muted-foreground">New Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Meetings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              {
                type: "deal_update",
                icon: BarChart3,
                title: "Deal Updated",
                description: "Enterprise Software Deal moved to Negotiation stage",
                user: "John Smith",
                time: "2 minutes ago",
                details: "€450,000 - TechCorp Inc."
              },
              {
                type: "meeting",
                icon: Calendar,
                title: "Meeting Completed",
                description: "Product demo with Innovation Labs finished",
                user: "Sarah Johnson",
                time: "15 minutes ago",
                details: "Duration: 45 minutes"
              },
              {
                type: "contact_added",
                icon: User,
                title: "New Contact Added",
                description: "Mike Wilson from Global Solutions added to contacts",
                user: "Lisa Brown",
                time: "1 hour ago",
                details: "VP of Technology"
              },
              {
                type: "email",
                icon: Mail,
                title: "Email Sent",
                description: "Follow-up email sent to potential client",
                user: "David Chen",
                time: "2 hours ago",
                details: "Re: Proposal Discussion"
              },
              {
                type: "call",
                icon: Phone,
                title: "Call Logged",
                description: "Discovery call with StartupXYZ completed",
                user: "Emily Davis",
                time: "3 hours ago",
                details: "Duration: 30 minutes"
              },
              {
                type: "document",
                icon: FileText,
                title: "Proposal Sent",
                description: "Proposal document sent to Acme Corporation",
                user: "John Smith",
                time: "4 hours ago",
                details: "€280,000 cloud migration project"
              },
              {
                type: "deal_created",
                icon: BarChart3,
                title: "New Deal Created",
                description: "AI Implementation project added to pipeline",
                user: "Sarah Johnson",
                time: "5 hours ago",
                details: "€180,000 - FutureTech Ltd."
              },
              {
                type: "meeting_scheduled",
                icon: Calendar,
                title: "Meeting Scheduled",
                description: "Contract discussion scheduled for tomorrow",
                user: "Mike Wilson",
                time: "6 hours ago",
                details: "2:00 PM - Global Solutions office"
              }
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'deal_update' || activity.type === 'deal_created' ? 'bg-green-100' :
                  activity.type === 'meeting' || activity.type === 'meeting_scheduled' ? 'bg-blue-100' :
                  activity.type === 'contact_added' ? 'bg-purple-100' :
                  activity.type === 'email' ? 'bg-orange-100' :
                  activity.type === 'call' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <activity.icon className={`w-5 h-5 ${
                    activity.type === 'deal_update' || activity.type === 'deal_created' ? 'text-green-600' :
                    activity.type === 'meeting' || activity.type === 'meeting_scheduled' ? 'text-blue-600' :
                    activity.type === 'contact_added' ? 'text-purple-600' :
                    activity.type === 'email' ? 'text-orange-600' :
                    activity.type === 'call' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{activity.title}</h3>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                  <p className="text-xs text-primary font-medium mb-2">{activity.details}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {activity.user}
                    </Badge>
                    <Badge variant={
                      activity.type === 'deal_update' || activity.type === 'deal_created' ? 'default' :
                      activity.type === 'meeting' || activity.type === 'meeting_scheduled' ? 'secondary' :
                      'outline'
                    } className="text-xs">
                      {activity.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feeds;
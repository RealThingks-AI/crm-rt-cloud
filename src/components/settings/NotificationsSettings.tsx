
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, Smartphone, Monitor, Users, TrendingUp, AlertCircle } from "lucide-react";

const NotificationsSettings = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    inApp: true,
    push: false,
    dealUpdates: true,
    leadAssignment: true,
    meetingReminders: true,
    quotaAlerts: false,
    systemUpdates: true
  });

  const handleToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleSave = () => {
    toast({
      title: "Notification preferences saved",
      description: "Your notification settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-base font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={() => handleToggle('email')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-base font-medium">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">Show notifications within the application</p>
              </div>
            </div>
            <Switch
              checked={notifications.inApp}
              onCheckedChange={() => handleToggle('inApp')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-base font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications on mobile devices</p>
              </div>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={() => handleToggle('push')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Event Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-base font-medium">Deal Updates</Label>
                <p className="text-sm text-muted-foreground">Get notified when deals are updated or moved</p>
              </div>
            </div>
            <Switch
              checked={notifications.dealUpdates}
              onCheckedChange={() => handleToggle('dealUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-base font-medium">Lead Assignment</Label>
                <p className="text-sm text-muted-foreground">Notify when leads are assigned to you</p>
              </div>
            </div>
            <Switch
              checked={notifications.leadAssignment}
              onCheckedChange={() => handleToggle('leadAssignment')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-base font-medium">Meeting Reminders</Label>
                <p className="text-sm text-muted-foreground">Reminders for upcoming meetings</p>
              </div>
            </div>
            <Switch
              checked={notifications.meetingReminders}
              onCheckedChange={() => handleToggle('meetingReminders')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Notification Settings</Button>
      </div>
    </div>
  );
};

export default NotificationsSettings;


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Settings, Monitor, Sun, Moon, Globe, Clock, Calendar } from "lucide-react";

const PreferencesSettings = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "en",
    dateFormat: "MM/dd/yyyy",
    timeFormat: "12h",
    timezone: "UTC"
  });

  const handleSave = () => {
    // Save preferences logic would go here
    toast({
      title: "Preferences saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Theme</Label>
            <Select value={preferences.theme} onValueChange={(value) => setPreferences({...preferences, theme: value})}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Language
            </Label>
            <Select value={preferences.language} onValueChange={(value) => setPreferences({...preferences, language: value})}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Date & Time Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Format */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Format
            </Label>
            <Select value={preferences.dateFormat} onValueChange={(value) => setPreferences({...preferences, dateFormat: value})}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/dd/yyyy">MM/dd/yyyy (12/31/2024)</SelectItem>
                <SelectItem value="dd/MM/yyyy">dd/MM/yyyy (31/12/2024)</SelectItem>
                <SelectItem value="yyyy-MM-dd">yyyy-MM-dd (2024-12-31)</SelectItem>
                <SelectItem value="dd MMM yyyy">dd MMM yyyy (31 Dec 2024)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Format */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Time Format</Label>
            <Select value={preferences.timeFormat} onValueChange={(value) => setPreferences({...preferences, timeFormat: value})}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                <SelectItem value="24h">24-hour (14:30)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Timezone</Label>
            <Select value={preferences.timezone} onValueChange={(value) => setPreferences({...preferences, timezone: value})}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Preferences</Button>
      </div>
    </div>
  );
};

export default PreferencesSettings;

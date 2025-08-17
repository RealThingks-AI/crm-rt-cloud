
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Palette, Sun, Moon, Monitor } from "lucide-react";

const PreferencesSettings = () => {
  const [theme, setTheme] = useState("auto");
  const { toast } = useToast();

  const handleSavePreferences = () => {
    // Here you would typically save to a backend or local storage
    toast({
      title: "Preferences Updated",
      description: "Your preferences have been saved successfully.",
    });
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "auto", label: "Auto", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-select">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme-select">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleSavePreferences} className="w-full sm:w-auto">
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreferencesSettings;

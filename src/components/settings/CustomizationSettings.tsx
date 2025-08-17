
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, 
  Upload, 
  Eye, 
  EyeOff,
  Image,
  Paintbrush,
  Layout
} from "lucide-react";

const CustomizationSettings = () => {
  const { toast } = useToast();
  const [modules, setModules] = useState({
    dashboard: true,
    contacts: true,
    leads: true,
    deals: true,
    meetings: true,
    reports: false,
    analytics: true
  });
  const [themeColors, setThemeColors] = useState({
    primary: "#3b82f6",
    secondary: "#64748b",
    accent: "#06b6d4"
  });

  const handleModuleToggle = (module: string) => {
    setModules(prev => ({
      ...prev,
      [module]: !prev[module as keyof typeof prev]
    }));
  };

  const handleSaveCustomization = () => {
    toast({
      title: "Customization Saved",
      description: "Your customization settings have been applied successfully.",
    });
  };

  const handleLogoUpload = () => {
    toast({
      title: "Logo Upload",
      description: "Logo upload functionality would be implemented here.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Module Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Control which modules are visible in your CRM interface.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(modules).map(([module, enabled]) => (
              <div key={module} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {enabled ? (
                    <Eye className="w-4 h-4 text-green-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="font-medium capitalize">{module}</span>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={() => handleModuleToggle(module)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
                  <Image className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Button onClick={handleLogoUpload} className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended: 256x256px, PNG or SVG format
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                placeholder="Your Company Name"
                defaultValue="RealThingks"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="w-5 h-5" />
            Theme Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Customize the color scheme of your CRM interface.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primary-color"
                  value={themeColors.primary}
                  onChange={(e) => setThemeColors({...themeColors, primary: e.target.value})}
                  className="w-12 h-10 border rounded cursor-pointer"
                />
                <Input
                  value={themeColors.primary}
                  onChange={(e) => setThemeColors({...themeColors, primary: e.target.value})}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="secondary-color"
                  value={themeColors.secondary}
                  onChange={(e) => setThemeColors({...themeColors, secondary: e.target.value})}
                  className="w-12 h-10 border rounded cursor-pointer"
                />
                <Input
                  value={themeColors.secondary}
                  onChange={(e) => setThemeColors({...themeColors, secondary: e.target.value})}
                  placeholder="#64748b"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="accent-color"
                  value={themeColors.accent}
                  onChange={(e) => setThemeColors({...themeColors, accent: e.target.value})}
                  className="w-12 h-10 border rounded cursor-pointer"
                />
                <Input
                  value={themeColors.accent}
                  onChange={(e) => setThemeColors({...themeColors, accent: e.target.value})}
                  placeholder="#06b6d4"
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Preview</h4>
            <div className="flex gap-2">
              <div 
                className="w-12 h-8 rounded border"
                style={{ backgroundColor: themeColors.primary }}
              />
              <div 
                className="w-12 h-8 rounded border"
                style={{ backgroundColor: themeColors.secondary }}
              />
              <div 
                className="w-12 h-8 rounded border"
                style={{ backgroundColor: themeColors.accent }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveCustomization}>
          Save Customization Settings
        </Button>
      </div>
    </div>
  );
};

export default CustomizationSettings;

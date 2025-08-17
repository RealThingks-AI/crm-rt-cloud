
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, 
  Eye, 
  EyeOff, 
  Upload,
  Settings,
  Monitor
} from "lucide-react";

const CustomizationSettings = () => {
  const { toast } = useToast();
  const [modules, setModules] = useState({
    dashboard: true,
    leads: true,
    contacts: true,
    deals: true,
    meetings: true,
    reports: false
  });

  const [branding, setBranding] = useState({
    companyName: "Your Company",
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b"
  });

  const handleModuleToggle = (module: string) => {
    setModules(prev => ({
      ...prev,
      [module]: !prev[module as keyof typeof prev]
    }));
  };

  const handleSaveCustomization = () => {
    toast({
      title: "Customization saved",
      description: "Your customization settings have been updated successfully.",
    });
  };

  const handleLogoUpload = () => {
    toast({
      title: "Logo upload",
      description: "Logo upload functionality would be implemented here.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Module Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Control which modules are visible in your CRM interface.
          </p>
          
          <div className="space-y-4">
            {Object.entries(modules).map(([module, enabled]) => (
              <div key={module} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label className="text-base font-medium capitalize">{module}</Label>
                    <p className="text-sm text-muted-foreground">
                      {module === 'dashboard' && 'Main dashboard and analytics'}
                      {module === 'leads' && 'Lead management and tracking'}
                      {module === 'contacts' && 'Contact management'}
                      {module === 'deals' && 'Deal pipeline and management'}
                      {module === 'meetings' && 'Meeting scheduling and tracking'}
                      {module === 'reports' && 'Advanced reporting and analytics'}
                    </p>
                  </div>
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
            <Palette className="w-5 h-5" />
            Branding & Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={branding.companyName}
                onChange={(e) => setBranding(prev => ({...prev, companyName: e.target.value}))}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                  <Settings className="w-6 h-6 text-muted-foreground" />
                </div>
                <Button variant="outline" onClick={handleLogoUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended size: 200x200px, PNG or JPG format
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({...prev, primaryColor: e.target.value}))}
                    className="w-16 h-10 p-1 border"
                  />
                  <Input
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({...prev, primaryColor: e.target.value}))}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding(prev => ({...prev, secondaryColor: e.target.value}))}
                    className="w-16 h-10 p-1 border"
                  />
                  <Input
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding(prev => ({...prev, secondaryColor: e.target.value}))}
                    placeholder="#64748b"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Preview</h4>
            <div className="p-4 border rounded-lg space-y-2">
              <div 
                className="h-8 rounded flex items-center px-3 text-white font-medium"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {branding.companyName} CRM
              </div>
              <div 
                className="h-6 rounded flex items-center px-3 text-white text-sm"
                style={{ backgroundColor: branding.secondaryColor }}
              >
                Sample navigation item
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveCustomization}>Save Customization</Button>
      </div>
    </div>
  );
};

export default CustomizationSettings;

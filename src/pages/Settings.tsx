
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Settings as SettingsIcon, 
  Bell, 
  Database, 
  Link, 
  Shield, 
  FileText,
  Palette 
} from "lucide-react";
import UserManagement from "@/components/UserManagement";
import PreferencesSettings from "@/components/settings/PreferencesSettings";
import NotificationsSettings from "@/components/settings/NotificationsSettings";
import DataStorageSettings from "@/components/settings/DataStorageSettings";
import IntegrationsSettings from "@/components/settings/IntegrationsSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import AuditLogsSettings from "@/components/settings/AuditLogsSettings";
import CustomizationSettings from "@/components/settings/CustomizationSettings";

const Settings = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="user-management" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
          <TabsTrigger value="user-management" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1">
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="data-storage" className="flex items-center gap-1">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-1">
            <Link className="w-4 h-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="audit-logs" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="customization" className="flex items-center gap-1">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Customize</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-management">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsSettings />
        </TabsContent>

        <TabsContent value="data-storage">
          <DataStorageSettings />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="audit-logs">
          <AuditLogsSettings />
        </TabsContent>

        <TabsContent value="customization">
          <CustomizationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

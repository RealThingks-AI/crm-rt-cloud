
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
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="user-management" className="w-full space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground min-w-full">
            <TabsTrigger value="user-management" className="flex items-center gap-2 px-4 py-2">
              <Users className="w-4 h-4" />
              <span className="whitespace-nowrap">Users</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2 px-4 py-2">
              <SettingsIcon className="w-4 h-4" />
              <span className="whitespace-nowrap">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 px-4 py-2">
              <Bell className="w-4 h-4" />
              <span className="whitespace-nowrap">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="data-storage" className="flex items-center gap-2 px-4 py-2">
              <Database className="w-4 h-4" />
              <span className="whitespace-nowrap">Data & Storage</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2 px-4 py-2">
              <Link className="w-4 h-4" />
              <span className="whitespace-nowrap">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 px-4 py-2">
              <Shield className="w-4 h-4" />
              <span className="whitespace-nowrap">Security</span>
            </TabsTrigger>
            <TabsTrigger value="audit-logs" className="flex items-center gap-2 px-4 py-2">
              <FileText className="w-4 h-4" />
              <span className="whitespace-nowrap">Audit & Logs</span>
            </TabsTrigger>
            <TabsTrigger value="customization" className="flex items-center gap-2 px-4 py-2">
              <Palette className="w-4 h-4" />
              <span className="whitespace-nowrap">Customization</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="user-management" className="space-y-0">
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

          <TabsContent value="preferences" className="space-y-0">
            <PreferencesSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-0">
            <NotificationsSettings />
          </TabsContent>

          <TabsContent value="data-storage" className="space-y-0">
            <DataStorageSettings />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-0">
            <IntegrationsSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-0">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="audit-logs" className="space-y-0">
            <AuditLogsSettings />
          </TabsContent>

          <TabsContent value="customization" className="space-y-0">
            <CustomizationSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Settings;

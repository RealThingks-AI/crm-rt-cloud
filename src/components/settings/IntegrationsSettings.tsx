
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Link, 
  Video, 
  Mail, 
  Webhook,
  Key,
  CheckCircle,
  XCircle,
  Settings
} from "lucide-react";

const IntegrationsSettings = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState({
    teams: false,
    outlook: false,
    webhooks: true
  });
  const [apiKey, setApiKey] = useState("");

  const handleConnect = (service: string) => {
    toast({
      title: `Connecting to ${service}`,
      description: `Redirecting to ${service} authentication...`,
    });
  };

  const handleDisconnect = (service: string) => {
    setIntegrations(prev => ({
      ...prev,
      [service]: false
    }));
    toast({
      title: `Disconnected from ${service}`,
      description: `${service} integration has been disabled.`,
    });
  };

  const handleGenerateApiKey = () => {
    const newKey = `crm_${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
    toast({
      title: "API Key Generated",
      description: "New API key has been generated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Microsoft Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Connect with Microsoft Teams to create meetings directly from deals and contacts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {integrations.teams ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {integrations.teams ? "Connected" : "Not Connected"}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {integrations.teams ? (
              <Button 
                variant="destructive" 
                onClick={() => handleDisconnect('teams')}
              >
                Disconnect
              </Button>
            ) : (
              <Button onClick={() => handleConnect('Microsoft Teams')}>
                Connect Teams
              </Button>
            )}
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Outlook Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Sync contacts and calendar events with Microsoft Outlook.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {integrations.outlook ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {integrations.outlook ? "Connected" : "Not Connected"}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {integrations.outlook ? (
              <Button 
                variant="destructive" 
                onClick={() => handleDisconnect('outlook')}
              >
                Disconnect
              </Button>
            ) : (
              <Button onClick={() => handleConnect('Outlook')}>
                Connect Outlook
              </Button>
            )}
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Sync Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure webhooks to receive real-time notifications about CRM events.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://your-app.com/webhook"
                type="url"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Events to Subscribe</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="deal-created" />
                  <Label htmlFor="deal-created">Deal Created</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="deal-updated" />
                  <Label htmlFor="deal-updated">Deal Updated</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="lead-assigned" />
                  <Label htmlFor="lead-assigned">Lead Assigned</Label>
                </div>
              </div>
            </div>
            
            <Button>Save Webhook Configuration</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate and manage API keys for external integrations.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Current API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  value={apiKey || "No API key generated"}
                  readOnly
                  type="password"
                />
                <Button variant="outline" onClick={handleGenerateApiKey}>
                  Generate New
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">API Usage</h4>
              <div className="text-sm text-muted-foreground">
                <p>Requests this month: 1,234 / 10,000</p>
                <p>Last request: 2 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsSettings;


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss } from "lucide-react";

const Feeds = () => {
  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rss className="w-5 h-5" />
            Feeds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">
              Coming soon - Feeds functionality will be implemented here.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feeds;

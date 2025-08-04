
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const Meetings = () => {
  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">
              Coming soon - Meetings functionality will be implemented here.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Meetings;

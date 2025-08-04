
import { useYearlyRevenueData } from "@/hooks/useYearlyRevenueData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, DollarSign, Target, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const YearlyRevenueSummary = () => {
  const { revenueData, actualRevenue, loading, refetch } = useYearlyRevenueData();
  const [isAddingTarget, setIsAddingTarget] = useState(false);
  const [newTargetYear, setNewTargetYear] = useState(new Date().getFullYear());
  const [newTargetAmount, setNewTargetAmount] = useState("");
  const [editingTarget, setEditingTarget] = useState<any>(null);

  // Calculate variance
  const variance = actualRevenue - (revenueData?.total_target || 0);
  const variancePercentage = revenueData?.total_target 
    ? ((variance / revenueData.total_target) * 100).toFixed(1)
    : "0";

  const handleAddTarget = async () => {
    if (!newTargetAmount || !newTargetYear) return;

    try {
      // For now, we'll just show a message since the table doesn't exist
      toast({
        title: "Note",
        description: "Revenue targets functionality is not yet implemented in the database.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error adding target:", error);
      toast({
        title: "Error",
        description: "Failed to add revenue target",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Revenue Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Revenue Summary {new Date().getFullYear()}
        </CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Set Target
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Revenue Target</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={newTargetYear}
                  onChange={(e) => setNewTargetYear(parseInt(e.target.value))}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Target Amount (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newTargetAmount}
                  onChange={(e) => setNewTargetAmount(e.target.value)}
                  placeholder="1000000"
                />
              </div>
              <Button onClick={handleAddTarget} className="w-full">
                Add Target
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Target */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-4 h-4" />
              <span className="text-sm">Target</span>
            </div>
            <div className="text-3xl font-bold">
              €{(revenueData?.total_target || 0).toLocaleString()}
            </div>
          </div>

          {/* Actual */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Actual</span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              €{actualRevenue.toLocaleString()}
            </div>
          </div>

          {/* Variance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              {variance >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm">Variance</span>
            </div>
            <div className={`text-3xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {variance >= 0 ? '+' : ''}€{variance.toLocaleString()}
            </div>
            <div className={`text-sm ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {variance >= 0 ? '+' : ''}{variancePercentage}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress to Target</span>
            <span>
              {revenueData?.total_target 
                ? Math.min(100, (actualRevenue / revenueData.total_target * 100)).toFixed(1)
                : "0"
              }%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                variance >= 0 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{
                width: `${
                  revenueData?.total_target 
                    ? Math.min(100, (actualRevenue / revenueData.total_target) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

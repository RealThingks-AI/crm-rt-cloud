import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Deal, DEAL_STAGES } from '@/hooks/useDeals';

interface DealsPipelineChartProps {
  deals: Deal[];
}

const DealsPipelineChart = ({ deals }: DealsPipelineChartProps) => {
  const stageColors = {
    'Discussions': 'hsl(220, 70%, 50%)',
    'Qualified': 'hsl(200, 70%, 50%)', 
    'RFQ': 'hsl(180, 70%, 50%)',
    'Offered': 'hsl(160, 70%, 50%)',
    'Won': 'hsl(120, 70%, 50%)',
    'Lost': 'hsl(0, 70%, 50%)',
    'Dropped': 'hsl(30, 70%, 50%)'
  };

  const chartData = DEAL_STAGES.map(stage => {
    const stageDeals = deals.filter(deal => deal.stage === stage);
    return {
      name: stage,
      value: stageDeals.length,
      fill: stageColors[stage as keyof typeof stageColors]
    };
  }).filter(item => item.value > 0);

  const chartConfig = {
    deals: {
      label: "Deals",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Pipeline Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-muted-foreground">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DealsPipelineChart;
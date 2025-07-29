import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface QuarterlyData {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
}

interface YearlyRevenueData {
  year: number;
  target: number;
  actualRevenue: QuarterlyData;
  projectedRevenue: QuarterlyData;
  totalActual: number;
  totalProjected: number;
}

export const useYearlyRevenueData = (selectedYear: number) => {
  const { data: revenueData, isLoading, error } = useQuery({
    queryKey: ['yearly-revenue', selectedYear],
    queryFn: async (): Promise<YearlyRevenueData> => {
      console.log('Fetching revenue data for year:', selectedYear);

      // Get yearly target
      const { data: targetData } = await supabase
        .from('yearly_revenue_targets')
        .select('total_target')
        .eq('year', selectedYear)
        .single();

      console.log('Target data:', targetData);

      // Get all deals for the selected year
      const { data: deals } = await supabase
        .from('deals')
        .select('*')
        .or(`closing_date.gte.${selectedYear}-01-01,closing_date.lte.${selectedYear}-12-31`);

      console.log('Deals for year:', deals);

      const actualRevenue: QuarterlyData = { q1: 0, q2: 0, q3: 0, q4: 0 };
      const projectedRevenue: QuarterlyData = { q1: 0, q2: 0, q3: 0, q4: 0 };

      let totalActualRevenue = 0;
      let totalProjectedRevenue = 0;

      deals?.forEach(deal => {
        console.log('Processing deal:', deal.deal_name, 'Stage:', deal.stage);
        
        // 1. Actual Revenue: Sum of Total Revenue from all Won stage deals
        if (deal.stage === 'Won' && deal.total_revenue) {
          const revenue = Number(deal.total_revenue);
          totalActualRevenue += revenue;
          console.log('Adding actual revenue from Won deal:', revenue, 'Total now:', totalActualRevenue);
          
          // Quarterly breakdown for actual revenue (Q1-Q4 Revenue from Won deals)
          if (deal.quarterly_revenue_q1) {
            actualRevenue.q1 += Number(deal.quarterly_revenue_q1);
          }
          if (deal.quarterly_revenue_q2) {
            actualRevenue.q2 += Number(deal.quarterly_revenue_q2);
          }
          if (deal.quarterly_revenue_q3) {
            actualRevenue.q3 += Number(deal.quarterly_revenue_q3);
          }
          if (deal.quarterly_revenue_q4) {
            actualRevenue.q4 += Number(deal.quarterly_revenue_q4);
          }
        }
        
        // 2. Projected Revenue: Sum of Total Contract Value from all RFQ stage deals
        else if (deal.stage === 'RFQ' && deal.total_contract_value) {
          const contractValue = Number(deal.total_contract_value);
          totalProjectedRevenue += contractValue;
          console.log('Adding projected revenue from RFQ deal:', contractValue, 'Total now:', totalProjectedRevenue);
          
          // Quarterly breakdown for projected revenue (distribute based on closing_date)
          if (deal.closing_date) {
            const closingDate = new Date(deal.closing_date);
            const quarter = Math.ceil((closingDate.getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
            const quarterKey = `q${quarter}` as keyof QuarterlyData;
            projectedRevenue[quarterKey] += contractValue;
            console.log(`Adding ${contractValue} to projected Q${quarter}`);
          }
        }
      });

      console.log('Final totals - Actual:', totalActualRevenue, 'Projected:', totalProjectedRevenue);
      console.log('Quarterly actual:', actualRevenue);
      console.log('Quarterly projected:', projectedRevenue);

      return {
        year: selectedYear,
        target: targetData?.total_target || 0,
        actualRevenue,
        projectedRevenue,
        totalActual: totalActualRevenue,
        totalProjected: totalProjectedRevenue
      };
    },
  });

  return { revenueData, isLoading, error };
};

export const useAvailableYears = () => {
  const { data: years, isLoading } = useQuery({
    queryKey: ['available-years'],
    queryFn: async (): Promise<number[]> => {
      // Get years from deals
      const { data: deals } = await supabase
        .from('deals')
        .select('closing_date')
        .not('closing_date', 'is', null);

      // Get years from targets
      const { data: targets } = await supabase
        .from('yearly_revenue_targets')
        .select('year');

      const yearSet = new Set<number>();
      
      // Add current year
      yearSet.add(new Date().getFullYear());
      
      // Add years from deals
      deals?.forEach(deal => {
        if (deal.closing_date) {
          const year = new Date(deal.closing_date).getFullYear();
          yearSet.add(year);
        }
      });

      // Add years from targets
      targets?.forEach(target => {
        yearSet.add(target.year);
      });

      return Array.from(yearSet).sort((a, b) => b - a);
    },
  });

  return { years: years || [], isLoading };
};

// Hook to get live dashboard stats
export const useDashboardStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log('Fetching dashboard stats...');
      
      const { data: deals } = await supabase
        .from('deals')
        .select('*');

      console.log('All deals for dashboard stats:', deals);

      const { data: meetings } = await supabase
        .from('meetings')
        .select('*')
        .eq('date', new Date().toISOString().split('T')[0]);

      const totalDeals = deals?.length || 0;
      
      // Calculate total revenue from Won deals using total_revenue field
      let totalRevenue = 0;
      deals?.forEach(deal => {
        console.log('Processing deal for dashboard:', deal.deal_name, 'Stage:', deal.stage, 'Total Revenue:', deal.total_revenue);
        
        if (deal.stage === 'Won' && deal.total_revenue) {
          const revenue = Number(deal.total_revenue);
          totalRevenue += revenue;
          console.log('Adding revenue from Won deal:', revenue, 'Running total:', totalRevenue);
        }
      });
      
      console.log('Final dashboard total revenue:', totalRevenue);
      
      const wonDeals = deals?.filter(deal => deal.stage === 'Won').length || 0;
      const todayMeetings = meetings?.length || 0;

      return {
        totalDeals,
        totalRevenue,
        wonDeals,
        todayMeetings
      };
    },
  });

  return { stats, isLoading };
};

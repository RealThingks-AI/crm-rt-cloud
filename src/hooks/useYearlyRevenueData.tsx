
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface YearlyRevenueData {
  year: number;
  total_target: number;
  q1_target: number;
  q2_target: number;
  q3_target: number;
  q4_target: number;
}

export const useYearlyRevenueData = () => {
  const [revenueData, setRevenueData] = useState<YearlyRevenueData | null>(null);
  const [actualRevenue, setActualRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRevenueData = async () => {
    try {
      const currentYear = new Date().getFullYear();

      // Since the yearly_revenue_targets table doesn't exist, we'll use placeholder data
      // In a real implementation, this would fetch from the database
      const mockRevenueData: YearlyRevenueData = {
        year: currentYear,
        total_target: 1000000, // Default 1M target
        q1_target: 250000,
        q2_target: 250000,
        q3_target: 250000,
        q4_target: 250000,
      };

      setRevenueData(mockRevenueData);

      // Calculate actual revenue from deals
      const { data: deals, error: dealsError } = await supabase
        .from("deals")
        .select("total_contract_value, expected_closing_date")
        .not("total_contract_value", "is", null);

      if (dealsError) throw dealsError;

      // Calculate actual revenue for current year
      const currentYearRevenue = deals
        ?.filter(deal => {
          if (!deal.expected_closing_date) return false;
          const dealYear = new Date(deal.expected_closing_date).getFullYear();
          return dealYear === currentYear;
        })
        .reduce((total, deal) => total + (deal.total_contract_value || 0), 0) || 0;

      setActualRevenue(currentYearRevenue);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      // Set default values on error
      setRevenueData({
        year: new Date().getFullYear(),
        total_target: 1000000,
        q1_target: 250000,
        q2_target: 250000,
        q3_target: 250000,
        q4_target: 250000,
      });
      setActualRevenue(0);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    setLoading(true);
    fetchRevenueData();
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  return {
    revenueData,
    actualRevenue,
    loading,
    refetch,
  };
};

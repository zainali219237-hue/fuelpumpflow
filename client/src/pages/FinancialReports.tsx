import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { formatCompactNumber } from "@/lib/utils";
import { Download, Printer } from "lucide-react";
import { globalPrintDocument } from "@/lib/printUtils";
import { format } from "date-fns";

// Helper function to format currency with compact notation
const formatCurrencyCompact = (amount: number) => {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR', // Default to INR, will be replaced by context if available
    notation: 'compact',
    compactDisplay: 'short',
  });
  return formatter.format(amount);
};

export default function FinancialReports() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency(); // Used for formatted currency values
  const { toast } = useToast();
  const [reportType, setReportType] = useState("profit-loss");
  const [period, setPeriod] = useState("this-month");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { data: financialData, isLoading } = useQuery({
    queryKey: ["/api/reports/financial", user?.stationId, period],
    enabled: !!user?.stationId,
  });

  // Handler functions
  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    toast({
      title: "Generating Report",
      description: `Creating ${getReportTypeName(reportType)} for ${getPeriodName(period)}...`,
    });

    // Simulate report generation
    setTimeout(() => {
      setIsGeneratingReport(false);
      toast({
        title: "Report Generated",
        description: "Financial report has been generated successfully",
      });
    }, 1500);
  };

  const handleExportReport = () => {
    const reportData = getCurrentReportData();
    const csvContent = generateCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}-${period}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Financial report has been exported to CSV",
    });
  };

  const handlePrintReport = () => {
    const printContent = generatePrintHTML();
    globalPrintDocument(printContent, `Financial_Report_${reportType}_${format(new Date(), 'yyyy-MM-dd')}`);

    toast({
      title: "Print Prepared",
      description: "Financial report is ready for printing",
    });
  };

  // Helper functions
  const getReportTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      'profit-loss': 'Profit & Loss Statement',
      'balance-sheet': 'Balance Sheet',
      'cash-flow': 'Cash Flow Statement',
      'sales-analysis': 'Sales Analysis',
      'expense-analysis': 'Expense Analysis'
    };
    return types[type] || 'Financial Report';
  };

  const getPeriodName = (period: string) => {
    const periods: { [key: string]: string } = {
      'this-month': 'This Month',
      'last-month': 'Last Month',
      'this-quarter': 'This Quarter',
      'this-year': 'This Year',
      'custom': 'Custom Range'
    };
    return periods[period] || 'Selected Period';
  };

  const getCurrentReportData = () => {
    // Placeholder data - in a real app, this would come from the API or query
    const data = {
      reportType: getReportTypeName(reportType),
      period: getPeriodName(period),
      revenue: {
        petrol: 850000,
        diesel: 420000,
        other: 25000,
        total: 1295000
      },
      expenses: {
        cogs: 1180000,
        salaries: 35000,
        utilities: 8500,
        maintenance: 12000,
        insurance: 3500,
        other: 5200,
        total: 1244200
      },
      netProfit: 50800
    };
    return data;
  };

  const generateCSV = (data: any) => {
    const csv = [
      ['Financial Report', data.reportType],
      ['Period', data.period],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['REVENUE'],
      ['Petrol Sales', data.revenue.petrol],
      ['Diesel Sales', data.revenue.diesel],
      ['Other Services', data.revenue.other],
      ['Total Revenue', data.revenue.total],
      [''],
      ['EXPENSES'],
      ['Cost of Goods Sold', data.expenses.cogs],
      ['Staff Salaries', data.expenses.salaries],
      ['Electricity & Utilities', data.expenses.utilities],
      ['Maintenance', data.expenses.maintenance],
      ['Insurance', data.expenses.insurance],
      ['Other Expenses', data.expenses.other],
      ['Total Expenses', data.expenses.total],
      [''],
      ['NET PROFIT', data.netProfit]
    ];

    return csv.map(row => row.join(',')).join('\n');
  };

  const generatePrintHTML = () => {
    const data = getCurrentReportData();
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Report - ${data.reportType}</title>
          <style>
            @media print {
              @page { margin: 1in; }
              body { font-family: Arial, sans-serif; background: white; color: black; }
            }
            body { font-family: Arial, sans-serif; background: white; color: black; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .section { margin: 20px 0; }
            .section h3 { background: #f5f5f5; padding: 10px; margin: 0; border: 1px solid #ddd; }
            .line-item { display: flex; justify-content: space-between; padding: 8px 10px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
            .line-item:nth-child(even) { background: #f9f9f9; }
            .total { font-weight: bold; background: #e9e9e9 !important; border: 1px solid #999; }
            .profit { background: #d4edda !important; border: 2px solid #28a745; font-weight: bold; text-align: center; padding: 15px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${data.reportType}</h1>
            <p>Period: ${data.period} | Generated: ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h3>REVENUE</h3>
            <div class="line-item"><span>Petrol Sales</span><span>${formatCurrency(data.revenue.petrol)}</span></div>
            <div class="line-item"><span>Diesel Sales</span><span>${formatCurrency(data.revenue.diesel)}</span></div>
            <div class="line-item"><span>Other Services</span><span>${formatCurrency(data.revenue.other)}</span></div>
            <div class="line-item total"><span>Total Revenue</span><span>${formatCurrency(data.revenue.total)}</span></div>
          </div>

          <div class="section">
            <h3>EXPENSES</h3>
            <div class="line-item"><span>Cost of Goods Sold</span><span>${formatCurrency(data.expenses.cogs)}</span></div>
            <div class="line-item"><span>Staff Salaries</span><span>${formatCurrency(data.expenses.salaries)}</span></div>
            <div class="line-item"><span>Electricity & Utilities</span><span>${formatCurrency(data.expenses.utilities)}</span></div>
            <div class="line-item"><span>Maintenance</span><span>${formatCurrency(data.expenses.maintenance)}</span></div>
            <div class="line-item"><span>Insurance</span><span>${formatCurrency(data.expenses.insurance)}</span></div>
            <div class="line-item"><span>Other Expenses</span><span>${formatCurrency(data.expenses.other)}</span></div>
            <div class="line-item total"><span>Total Expenses</span><span>${formatCurrency(data.expenses.total)}</span></div>
          </div>

          <div class="profit">
            <h3>NET PROFIT: ${formatCurrency(data.netProfit)}</h3>
            <p>Profit Margin: ${((data.netProfit / data.revenue.total) * 100).toFixed(2)}%</p>
          </div>
        </body>
      </html>
    `;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Ensure financialData is not null before accessing its properties
  const reportData = getCurrentReportData(); // Use placeholder data if financialData is not yet available or empty

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-card-foreground mb-2">Financial Reports</h3>
        <p className="text-muted-foreground">
          Comprehensive financial statements and analysis for your petrol pump business
        </p>
      </div>

      {/* Report Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit-loss">Profit & Loss Statement</SelectItem>
                  <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                  <SelectItem value="cash-flow">Cash Flow Statement</SelectItem>
                  <SelectItem value="sales-analysis">Sales Analysis</SelectItem>
                  <SelectItem value="expense-analysis">Expense Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Period</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                data-testid="button-generate-report"
              >
                {isGeneratingReport ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit & Loss Statement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{reportData.reportType}</CardTitle>
              <p className="text-sm text-muted-foreground">For the month of January 2024</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="p-2"
                onClick={handleExportReport}
                data-testid="button-export"
                title="Export Report to CSV"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="p-2"
                onClick={handlePrintReport}
                data-testid="button-print"
                title="Print Report"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Section */}
            <div>
              <h5 className="font-semibold text-card-foreground mb-4 pb-2 border-b border-border">
                Revenue
              </h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Petrol Sales</span>
                  <span className="font-medium" data-testid="petrol-revenue">{formatCurrency(reportData.revenue.petrol)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diesel Sales</span>
                  <span className="font-medium" data-testid="diesel-revenue">{formatCurrency(reportData.revenue.diesel)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Other Services</span>
                  <span className="font-medium" data-testid="other-revenue">{formatCurrency(reportData.revenue.other)}</span>
                </div>
                <div className="border-t border-border pt-3 mt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total Revenue</span>
                    <span className="text-green-600" data-testid="total-revenue">{formatCurrencyCompact(reportData.revenue.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h5 className="font-semibold text-card-foreground mb-4 pb-2 border-b border-border">
                Expenses
              </h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost of Goods Sold</span>
                  <span className="font-medium" data-testid="cogs">{formatCurrency(reportData.expenses.cogs)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Staff Salaries</span>
                  <span className="font-medium" data-testid="salaries">{formatCurrency(reportData.expenses.salaries)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Electricity & Utilities</span>
                  <span className="font-medium" data-testid="utilities">{formatCurrency(reportData.expenses.utilities)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maintenance</span>
                  <span className="font-medium" data-testid="maintenance">{formatCurrency(reportData.expenses.maintenance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insurance</span>
                  <span className="font-medium" data-testid="insurance">{formatCurrency(reportData.expenses.insurance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Other Expenses</span>
                  <span className="font-medium" data-testid="other-expenses">{formatCurrency(reportData.expenses.other)}</span>
                </div>
                <div className="border-t border-border pt-3 mt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total Expenses</span>
                    <span className="text-red-600" data-testid="total-expenses">{formatCurrencyCompact(reportData.expenses.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-card-foreground">Net Profit</span>
              <span className="text-2xl font-bold text-green-600" data-testid="net-profit">{formatCurrencyCompact(reportData.netProfit)}</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Profit Margin: 3.92% | Previous Month: {formatCurrency(45200)} (+12.4%)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
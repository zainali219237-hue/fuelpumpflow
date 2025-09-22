import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatAmount } from "@/lib/currency";
import { formatCompactNumber } from "@/lib/utils";
import { 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Banknote,
  Receipt,
  Download,
  RefreshCw,
  PieChart,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { globalPrintDocument } from "@/lib/printUtils";

interface SalesByMethod {
  paymentMethod: string;
  totalAmount: string;
  count: number;
  currencyCode: string;
}

interface ExpensesByCategory {
  category: string;
  totalAmount: string;
  currencyCode: string;
}

interface DailyReportData {
  date: string;
  salesByMethod: SalesByMethod[];
  expenses: ExpensesByCategory[];
}

export default function DailyReports() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Dummy function for dynamic currency formatting, replace with actual implementation if available
  const formatCurrencyCompact = (amount: number): string => {
    // Assuming formatCurrency from CurrencyContext handles the symbol and formatting
    // If formatCurrencyCompact is intended to be a separate function, its implementation would go here.
    // For now, we'll use the provided formatCurrency and ensure it returns a string with the symbol.
    // If formatCompactNumber is intended to be used with currency, it should be adapted.
    // Example: return `${formatCurrency(amount)} ${getCurrencySymbol(currencyCode)}`;
    // Using formatCurrency directly as it should handle the symbol and locale.
    return formatCurrency(amount);
  };


  const { data: dailyReport, isLoading, refetch } = useQuery<DailyReportData>({
    queryKey: [`/api/reports/daily/${user?.stationId}?date=${format(selectedDate, 'yyyy-MM-dd')}`],
    enabled: !!user?.stationId,
    refetchInterval: 30000, // Refresh every 30 seconds for near real-time data
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    // Create CSV export
    if (!dailyReport) return;

    const csvContent = [
      ['Daily Report - ' + format(selectedDate, 'PPP')],
      [''],
      ['Sales by Payment Method'],
      ['Method', 'Amount', 'Currency', 'Count'],
      ...dailyReport.salesByMethod.map(item => [
        item.paymentMethod,
        item.totalAmount,
        item.currencyCode,
        item.count.toString()
      ]),
      [''],
      ['Expenses by Category'],
      ['Category', 'Amount', 'Currency'],
      ...dailyReport.expenses.map(item => [
        item.category,
        item.totalAmount,
        item.currencyCode
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-report-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return <Banknote className="w-5 h-5 text-green-500" />;
      case 'card':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'credit':
        return <Receipt className="w-5 h-5 text-orange-500" />;
      case 'fleet':
        return <DollarSign className="w-5 h-5 text-purple-500" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  const totalSales = dailyReport?.salesByMethod.reduce(
    (sum, item) => sum + parseFloat(item.totalAmount || '0'), 0
  ) || 0;

  const totalTransactions = dailyReport?.salesByMethod.reduce(
    (sum, item) => sum + (item.count || 0), 0
  ) || 0;

  const totalExpenses = dailyReport?.expenses.reduce(
    (sum, item) => sum + parseFloat(item.totalAmount || '0'), 0
  ) || 0;

  const netProfit = totalSales - totalExpenses;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Daily Reports</h1>
          <p className="text-muted-foreground">
            Daily sales and expense breakdown for {format(selectedDate, 'PPP')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            size="sm"
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            size="sm"
            disabled={!dailyReport}
            data-testid="button-export"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Report Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
                data-testid="button-date-picker"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) =>
                  date > new Date() || date < new Date("2023-01-01")
                }
                initialFocus
                data-testid="calendar-picker"
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <div className="text-3xl font-bold text-green-600" data-testid="total-sales">
                  {formatCurrencyCompact(totalSales)}
                </div>
                <p className="text-sm text-muted-foreground">{totalTransactions} transactions</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <div className="text-3xl font-bold text-red-600" data-testid="total-expenses">
                  {formatCurrencyCompact(totalExpenses)}
                </div>
                <p className="text-sm text-muted-foreground">Daily operational costs</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="net-profit">
                  {formatCurrencyCompact(Math.abs(netProfit))}
                </div>
                <p className="text-sm text-muted-foreground">Sales - Expenses</p>
              </div>
              <DollarSign className={`w-8 h-8 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Transaction</p>
                <div className="text-3xl font-bold text-blue-600" data-testid="avg-transaction">
                  {formatCurrencyCompact(totalTransactions > 0 ? totalSales / totalTransactions : 0)}
                </div>
                <p className="text-sm text-muted-foreground">Per transaction</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Sales by Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dailyReport?.salesByMethod && dailyReport.salesByMethod.length > 0 ? (
              dailyReport.salesByMethod.map((sale, index) => {
                const percentage = totalSales > 0 ? (parseFloat(sale.totalAmount || '0') / totalSales) * 100 : 0;
                return (
                  <div key={`${sale.paymentMethod}-${sale.currencyCode}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(sale.paymentMethod)}
                        <span className="font-medium capitalize" data-testid={`payment-method-${index}`}>
                          {sale.paymentMethod}
                        </span>
                        <Badge variant="outline" data-testid={`payment-currency-${index}`}>
                          {sale.currencyCode}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold" data-testid={`payment-amount-${index}`}>
                          {formatAmount(parseFloat(sale.totalAmount || '0'), sale.currencyCode as any)}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`payment-count-${index}`}>
                          {sale.count} transactions
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                        data-testid={`payment-progress-${index}`}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {percentage.toFixed(1)}% of total sales
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No sales data for this date</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dailyReport?.expenses && dailyReport.expenses.length > 0 ? (
              dailyReport.expenses.map((expense, index) => {
                const percentage = totalExpenses > 0 ? (parseFloat(expense.totalAmount || '0') / totalExpenses) * 100 : 0;
                return (
                  <div key={`${expense.category}-${expense.currencyCode}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                        <span className="font-medium capitalize" data-testid={`expense-category-${index}`}>
                          {expense.category}
                        </span>
                        <Badge variant="outline" data-testid={`expense-currency-${index}`}>
                          {expense.currencyCode}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600" data-testid={`expense-amount-${index}`}>
                          {formatAmount(parseFloat(expense.totalAmount || '0'), expense.currencyCode as any)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                        data-testid={`expense-progress-${index}`}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {percentage.toFixed(1)}% of total expenses
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No expenses recorded for this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sales Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Sales Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue:</span>
                  <span className="font-medium text-green-600" data-testid="summary-revenue">
                    {formatCurrencyCompact(totalSales)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Transactions:</span>
                  <span className="font-medium" data-testid="summary-transactions">
                    {totalTransactions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Sale:</span>
                  <span className="font-medium" data-testid="summary-avg-sale">
                    {formatCurrencyCompact(totalTransactions > 0 ? totalSales / totalTransactions : 0)}
                  </span>
                </div>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block" />

            {/* Expense Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Expense Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Expenses:</span>
                  <span className="font-medium text-red-600" data-testid="summary-total-expenses">
                    {formatCurrencyCompact(totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categories:</span>
                  <span className="font-medium" data-testid="summary-expense-categories">
                    {dailyReport?.expenses.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expense Ratio:</span>
                  <span className="font-medium" data-testid="summary-expense-ratio">
                    {totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block" />

            {/* Profit Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <DollarSign className={`w-5 h-5 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                Profit Analysis
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Profit:</span>
                  <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="summary-net-profit">
                    {formatCurrencyCompact(netProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit Margin:</span>
                  <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="summary-profit-margin">
                    {totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    variant={netProfit >= 0 ? 'default' : 'destructive'}
                    data-testid="summary-profit-status"
                  >
                    {netProfit >= 0 ? 'Profitable' : 'Loss'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Data State */}
      {(!dailyReport?.salesByMethod || dailyReport.salesByMethod.length === 0) && 
       (!dailyReport?.expenses || dailyReport.expenses.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4">
              No sales or expense data found for {format(selectedDate, 'PPP')}.
            </p>
            <p className="text-sm text-muted-foreground">
              Try selecting a different date or check if transactions were recorded.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
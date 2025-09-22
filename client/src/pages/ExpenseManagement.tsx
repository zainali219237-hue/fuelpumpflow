import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiRequest } from "@/lib/api";
import { CreditCard, Receipt, Eye, Edit, Trash2, Plus, Download, Printer } from "lucide-react";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { PrintActions } from "@/components/ui/print-actions";
import { generatePrintTemplate, globalPrintDocument } from "@/lib/printUtils";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  expenseDate: z.string().min(1, "Date is required"),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

interface Expense {
  id: string;
  description: string;
  amount: string;
  category: string;
  paymentMethod: string;
  expenseDate: string;
  receiptNumber?: string;
  notes?: string;
  stationId: string;
  userId: string;
  createdAt: string;
}

export default function ExpenseManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      paymentMethod: "",
      expenseDate: new Date().toISOString().split('T')[0],
      receiptNumber: "",
      notes: "",
    },
    mode: "onChange"
  });

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", user?.stationId],
    queryFn: () => apiRequest("GET", `/api/expenses?stationId=${user?.stationId}`).then(res => res.json()),
    enabled: !!user?.stationId,
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating expense with data:", data);

      if (!user?.stationId || !user?.id) {
        throw new Error("User session not properly loaded");
      }

      const expenseData = {
        description: data.description,
        amount: parseFloat(data.amount).toString(),
        category: data.category,
        paymentMethod: data.paymentMethod,
        expenseDate: data.expenseDate,
        receiptNumber: data.receiptNumber || "",
        notes: data.notes || "",
        stationId: user.stationId,
        userId: user.id,
        currencyCode: "PKR",
      };

      console.log("Final expense data being sent:", expenseData);

      const response = await apiRequest("POST", "/api/expenses", expenseData);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Failed to parse success response:", parseError);
        throw new Error("Invalid response format from server");
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Expense recorded",
        description: "Expense has been recorded successfully",
      });
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", user?.stationId] });
    },
    onError: (error: any) => {
      console.error("Expense creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record expense",
        variant: "destructive",
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const expenseData = {
        description: data.description,
        amount: parseFloat(data.amount).toString(),
        category: data.category,
        paymentMethod: data.paymentMethod,
        expenseDate: data.expenseDate,
        receiptNumber: data.receiptNumber || "",
        notes: data.notes || "",
        currencyCode: "PKR",
      };
      
      console.log("Updating expense data:", expenseData);
      
      const response = await apiRequest("PUT", `/api/expenses/${id}`, expenseData);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Failed to parse success response:", parseError);
        throw new Error("Invalid response format from server");
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Expense updated",
        description: "Expense has been updated successfully",
      });
      setEditExpenseId(null);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", user?.stationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update expense",
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/expenses/${id}`);
      if (!response.ok) throw new Error('Failed to delete expense');
    },
    onSuccess: () => {
      toast({
        title: "Expense deleted",
        description: "Expense has been deleted successfully",
      });
      setDeleteConfirmOpen(false);
      setExpenseToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", user?.stationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    console.log("Expense form submission:", { data, editExpenseId, user });

    if (editExpenseId) {
      console.log("Updating expense with ID:", editExpenseId);
      updateExpenseMutation.mutate({ id: editExpenseId, data });
    } else {
      console.log("Creating new expense");
      createExpenseMutation.mutate(data);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditExpenseId(expense.id);
    form.reset({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      receiptNumber: expense.receiptNumber || "",
      notes: expense.notes || "",
    });
    setOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteExpense = () => {
    if (expenseToDelete) {
      deleteExpenseMutation.mutate(expenseToDelete.id);
    }
  };

  const handlePrintReceipt = (expense: Expense) => {
    const template = generatePrintTemplate(expense, 'expense');
    globalPrintDocument(template);
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-card-foreground">Expense Management</h3>
          <p className="text-muted-foreground">Track and manage business expenses</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditExpenseId(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-expense">
              <Plus className="w-4 h-4 mr-2" />
              Record Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editExpenseId ? "Edit Expense" : "Record New Expense"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Input placeholder="Office supplies, fuel, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fuel">Fuel</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="utilities">Utilities</SelectItem>
                            <SelectItem value="supplies">Supplies</SelectItem>
                            <SelectItem value="salaries">Salaries</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expenseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            max="9999-12-31"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="receiptNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional receipt reference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional details" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}>
                    {editExpenseId ? "Update Expense" : "Record Expense"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{expenses.length}</div>
            <div className="text-sm text-muted-foreground">Total Expenses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {expenses.filter(e => new Date(e.expenseDate).getMonth() === new Date().getMonth()).length}
            </div>
            <div className="text-sm text-muted-foreground">This Month</div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Payment Method</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? expenses.map((expense, index) => (
                  <tr key={expense.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 text-sm">
                      {new Date(expense.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-medium">{expense.description}</td>
                    <td className="p-3">
                      <Badge variant="outline">{expense.category}</Badge>
                    </td>
                    <td className="p-3 text-right font-semibold text-red-600">
                      {formatCurrency(parseFloat(expense.amount))}
                    </td>
                    <td className="p-3 capitalize">{expense.paymentMethod.replace('_', ' ')}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintReceipt(expense)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditExpense(expense)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50"
                          title="Edit Expense"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No expenses recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteExpense}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        itemName={expenseToDelete?.description || "expense"}
        isLoading={deleteExpenseMutation.isPending}
      />
    </div>
  );
}
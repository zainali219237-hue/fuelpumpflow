
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useStation } from "@/contexts/StationContext";
import { apiRequest } from "@/lib/api";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Link } from "wouter";
import { generatePrintTemplate, printDocument, downloadAsPDF, downloadAsPNG } from "@/lib/printUtils";
import type { Payment, Customer, Supplier } from "@shared/schema";

interface PaymentWithDetails extends Payment {
  customer?: Customer;
  supplier?: Supplier;
}

function PaymentHistory() {
  const { id, type } = useParams<{ id: string; type: string }>();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { stationSettings } = useStation();

  const { data: payments = [], isLoading } = useQuery<PaymentWithDetails[]>({
    queryKey: ["/api/payments", user?.stationId, id, type],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/payments/${user?.stationId}`);
      const allPayments = await response.json();
      return allPayments.filter((payment: PaymentWithDetails) =>
        type === 'customer' ? payment.customerId === id : payment.supplierId === id
      );
    },
    enabled: !!user?.stationId && !!id && !!type,
  });

  const { data: customerData } = useQuery<Customer>({
    queryKey: ["/api/customers", id],
    queryFn: () => apiRequest("GET", `/api/customers/${id}`).then(res => res.json()),
    enabled: !!id && type === 'customer',
  });

  const { data: supplierData } = useQuery<Supplier>({
    queryKey: ["/api/suppliers", id],
    queryFn: () => apiRequest("GET", `/api/suppliers/${id}`).then(res => res.json()),
    enabled: !!id && type === 'supplier',
  });

  const entity = type === 'customer' ? customerData : supplierData;
  const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const handlePrint = () => {
    if (!entity || !payments) return;
    
    const statementData = {
      entityType: type === 'customer' ? 'Customer' : 'Supplier',
      entityName: entity.name,
      entity,
      payments,
      totalPayments: formatCurrency(totalPayments),
      outstandingAmount: formatCurrency(parseFloat(entity.outstandingAmount || '0')),
      stationName: stationSettings?.stationName || 'FuelFlow Station',
      stationAddress: stationSettings?.address || '',
      stationPhone: stationSettings?.contactNumber || '',
      stationEmail: stationSettings?.email || '',
      generatedDate: new Date().toLocaleDateString()
    };

    const template = generatePrintTemplate(statementData, 'statement');
    printDocument(template);
  };

  const handleDownloadPDF = () => {
    if (!entity || !payments) return;

    const statementData = {
      entityType: type === 'customer' ? 'Customer' : 'Supplier',
      entityName: entity.name,
      entity,
      payments,
      totalPayments: formatCurrency(totalPayments),
      outstandingAmount: formatCurrency(parseFloat(entity.outstandingAmount || '0')),
      stationName: stationSettings?.stationName || 'FuelFlow Station',
      stationAddress: stationSettings?.address || '',
      stationPhone: stationSettings?.contactNumber || '',
      stationEmail: stationSettings?.email || '',
      generatedDate: new Date().toLocaleDateString()
    };

    const template = generatePrintTemplate(statementData, 'statement');
    downloadAsPDF(template);
  };

  const handleDownloadPNG = () => {
    if (!entity || !payments) return;

    const statementData = {
      entityType: type === 'customer' ? 'Customer' : 'Supplier',
      entityName: entity.name,
      entity,
      payments,
      totalPayments: formatCurrency(totalPayments),
      outstandingAmount: formatCurrency(parseFloat(entity.outstandingAmount || '0')),
      stationName: stationSettings?.stationName || 'FuelFlow Station',
      stationAddress: stationSettings?.address || '',
      stationPhone: stationSettings?.contactNumber || '',
      stationEmail: stationSettings?.email || '',
      generatedDate: new Date().toLocaleDateString()
    };

    const template = generatePrintTemplate(statementData, 'statement');
    downloadAsPNG(template);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={type === 'customer' ? '/accounts-receivable' : '/accounts-payable'}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold">Payment History - {entity?.name}</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button onClick={handlePrint} size="sm" className="w-full sm:w-auto">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button onClick={handleDownloadPNG} variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                PNG
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <Card className="print:shadow-none print:border-none">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <span>Payment History</span>
              <div className="text-sm text-muted-foreground">
                Total: {formatCurrency(totalPayments)} | Outstanding: {formatCurrency(parseFloat(entity?.outstandingAmount || '0'))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.length > 0 ? payments.map((payment) => (
                <div key={payment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-md gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{formatCurrency(parseFloat(payment.amount))}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()} • {payment.paymentMethod}
                    </div>
                    {payment.referenceNumber && (
                      <div className="text-xs text-muted-foreground">Ref: {payment.referenceNumber}</div>
                    )}
                    {payment.notes && (
                      <div className="text-xs text-muted-foreground mt-1">{payment.notes}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline">{payment.type}</Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )) : (
                // Sample payment records for template demonstration
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-md gap-4 opacity-60">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{formatCurrency(5000)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(Date.now() - 86400000).toLocaleDateString()} • Cash
                      </div>
                      <div className="text-xs text-muted-foreground">Ref: PAY-001</div>
                      <div className="text-xs text-muted-foreground mt-1">Partial payment received</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline">receivable</Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(Date.now() - 86400000).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-md gap-4 opacity-60">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{formatCurrency(3000)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(Date.now() - 172800000).toLocaleDateString()} • Card
                      </div>
                      <div className="text-xs text-muted-foreground">Ref: PAY-002</div>
                      <div className="text-xs text-muted-foreground mt-1">Credit payment</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline">receivable</Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(Date.now() - 172800000).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-muted-foreground py-4 text-xs">
                    <div className="text-sm font-medium mb-2">Sample Payment Records</div>
                    <div className="text-xs">These are sample records. Real payments will appear here once recorded.</div>
                  </div>
                </>
              )}
            </div>
            
            {payments.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{payments.length}</div>
                    <div className="text-sm text-muted-foreground">Total Payments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPayments)}</div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{formatCurrency(parseFloat(entity?.outstandingAmount || '0'))}</div>
                    <div className="text-sm text-muted-foreground">Outstanding</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PaymentHistory;

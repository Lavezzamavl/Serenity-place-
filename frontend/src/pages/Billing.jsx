import { useState, useEffect, Fragment } from 'react';
import { Receipt, TrendingUp, AlertCircle, Plus, X, Loader2, CreditCard, Printer, Pencil, Check } from 'lucide-react';
import { getInvoices, createInvoice, recordPayment, updatePaymentMpesaCode, getInvoicePrintHtml } from '../api/billing';
import { getPatients } from '../api/patients';

const STATUS_STYLES = {
  Paid: 'bg-sage/15 text-sage',
  Partial: 'bg-amber-50 text-amber-600',
  Outstanding: 'bg-red-50 text-red-500',
};

const EMPTY_ITEM = { description: '', quantity: 1, unit_price: '' };

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ patient: '', items: [{ ...EMPTY_ITEM }] });
  const [invoiceError, setInvoiceError] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  const [paymentTarget, setPaymentTarget] = useState(null); // invoice being paid
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Cash', mpesa_code: '' });
  const [paymentError, setPaymentError] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [editingMpesaId, setEditingMpesaId] = useState(null);
  const [mpesaEditValue, setMpesaEditValue] = useState('');
  const [printingId, setPrintingId] = useState(null);

  const loadInvoices = () => getInvoices().then(setInvoices);

  useEffect(() => {
    Promise.all([loadInvoices(), getPatients().then(setPatients)])
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.total_paid), 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + Number(i.balance), 0);

  // --- Invoice creation ---
  const updateItem = (index, field, value) => {
    const items = [...invoiceForm.items];
    items[index] = { ...items[index], [field]: value };
    setInvoiceForm({ ...invoiceForm, items });
  };
  const addItemRow = () => setInvoiceForm({ ...invoiceForm, items: [...invoiceForm.items, { ...EMPTY_ITEM }] });
  const removeItemRow = (index) => setInvoiceForm({
    ...invoiceForm, items: invoiceForm.items.filter((_, i) => i !== index),
  });

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setInvoiceError('');
    if (!invoiceForm.patient) return setInvoiceError('Select a patient.');
    const validItems = invoiceForm.items.filter((it) => it.description.trim() && Number(it.unit_price) > 0);
    if (validItems.length === 0) return setInvoiceError('Add at least one billable item with a price.');

    setSubmittingInvoice(true);
    try {
      await createInvoice(invoiceForm.patient, validItems.map((it) => ({
        description: it.description, quantity: Number(it.quantity) || 1, unit_price: Number(it.unit_price),
      })));
      await loadInvoices();
      setInvoiceForm({ patient: '', items: [{ ...EMPTY_ITEM }] });
      setShowInvoiceForm(false);
    } catch (err) {
      setInvoiceError(err.response?.status === 403
        ? "Your role doesn't have permission to create invoices."
        : 'Could not create invoice. Please try again.');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  // --- Payment recording ---
  const openPayment = (invoice) => {
    setPaymentTarget(invoice);
    setPaymentForm({ amount: '', method: 'Cash', mpesa_code: '' });
    setPaymentError('');
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) return setPaymentError('Enter a valid amount.');
    if (amount > paymentTarget.balance) return setPaymentError(`Exceeds outstanding balance of KES ${paymentTarget.balance}.`);

    setSubmittingPayment(true);
    try {
      await recordPayment(paymentTarget.id, amount, paymentForm.method, paymentForm.mpesa_code);
      await loadInvoices();
      setPaymentTarget(null);
    } catch (err) {
      const serverMsg = err.response?.data?.amount?.[0];
      setPaymentError(serverMsg || 'Could not record payment. Please try again.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // --- M-Pesa code correction after the fact ---
  const startEditMpesa = (payment) => {
    setEditingMpesaId(payment.id);
    setMpesaEditValue(payment.mpesa_code || '');
  };

  const saveMpesaEdit = async (paymentId) => {
    try {
      await updatePaymentMpesaCode(paymentId, mpesaEditValue);
      await loadInvoices();
      setEditingMpesaId(null);
    } catch {
      // leave the field open so the user can retry
    }
  };

  // --- Printable invoice ---
  const handlePrint = async (invoiceId) => {
    setPrintingId(invoiceId);
    try {
      const html = await getInvoicePrintHtml(invoiceId);
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
      }
    } catch {
      alert('Could not open the printable invoice. Please try again.');
    } finally {
      setPrintingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading billing data...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-slate/60 text-xs uppercase tracking-wide mb-2">
            <TrendingUp className="w-3.5 h-3.5" /> Collected
          </div>
          <p className="font-display text-2xl font-semibold text-harbor">KES {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-slate/60 text-xs uppercase tracking-wide mb-2">
            <AlertCircle className="w-3.5 h-3.5" /> Outstanding
          </div>
          <p className="font-display text-2xl font-semibold text-red-500">KES {totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-slate/60 text-xs uppercase tracking-wide mb-2">
            <Receipt className="w-3.5 h-3.5" /> Invoices Issued
          </div>
          <p className="font-display text-2xl font-semibold text-harbor">{invoices.length}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowInvoiceForm(true)}
          className="flex items-center gap-2 bg-serenity text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-harbor transition-colors"
        >
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="px-5 py-3 border-b border-gray-100">
          <h4 className="font-medium text-harbor">Invoices</h4>
        </div>
        <table className="w-full text-sm min-w-[820px]">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Invoice</th>
              <th className="text-left px-5 py-3 font-medium">Patient</th>
              <th className="text-left px-5 py-3 font-medium">Total</th>
              <th className="text-left px-5 py-3 font-medium">Paid</th>
              <th className="text-left px-5 py-3 font-medium">Balance</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <Fragment key={inv.id}>
                <tr className="hover:bg-mist/50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-harbor">
                    <button
                      onClick={() => setExpandedInvoice(expandedInvoice === inv.id ? null : inv.id)}
                      className="hover:underline"
                    >
                      {inv.invoice_number}
                    </button>
                  </td>
                  <td className="px-5 py-3 font-medium text-harbor">{inv.patient_name}</td>
                  <td className="px-5 py-3 font-mono text-harbor">KES {Number(inv.total_amount).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-slate">KES {Number(inv.total_paid).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-slate">KES {Number(inv.balance).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => openPayment(inv)}
                          className="flex items-center gap-1 text-serenity text-xs font-medium hover:text-harbor"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Record Payment
                        </button>
                      )}
                      <button
                        onClick={() => handlePrint(inv.id)}
                        disabled={printingId === inv.id}
                        className="flex items-center gap-1 text-slate text-xs font-medium hover:text-harbor disabled:opacity-50"
                      >
                        {printingId === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedInvoice === inv.id && (
                  <tr key={`${inv.id}-detail`} className="bg-mist/40">
                    <td colSpan={7} className="px-5 py-4">
                      <p className="text-xs font-medium text-slate uppercase tracking-wide mb-2">Charges</p>
                      <table className="w-full text-xs mb-3">
                        <tbody>
                          {inv.items.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100 last:border-0">
                              <td className="py-1.5 text-harbor">{item.description}</td>
                              <td className="py-1.5 text-slate text-right w-16">x{item.quantity}</td>
                              <td className="py-1.5 text-slate text-right w-28 font-mono">KES {Number(item.line_total).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <p className="text-xs font-medium text-slate uppercase tracking-wide mb-2">Payments</p>
                      {inv.payments.length === 0 ? (
                        <p className="text-xs text-slate/50">No payments recorded yet.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <tbody>
                            {inv.payments.map((p) => (
                              <tr key={p.id} className="border-b border-gray-100 last:border-0">
                                <td className="py-1.5 text-slate w-32">{new Date(p.received_at).toLocaleDateString()}</td>
                                <td className="py-1.5 text-harbor w-28">{p.method}</td>
                                <td className="py-1.5 text-slate">
                                  {p.method === 'M-Pesa' ? (
                                    editingMpesaId === p.id ? (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          value={mpesaEditValue}
                                          onChange={(e) => setMpesaEditValue(e.target.value)}
                                          placeholder="M-Pesa code"
                                          className="px-2 py-1 rounded border border-gray-200 text-xs w-32"
                                          autoFocus
                                        />
                                        <button onClick={() => saveMpesaEdit(p.id)} className="text-sage hover:text-harbor">
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => startEditMpesa(p)}
                                        className="flex items-center gap-1 font-mono hover:text-harbor"
                                        title="Click to correct the M-Pesa code"
                                      >
                                        {p.mpesa_code || '— add code'} <Pencil className="w-3 h-3 opacity-50" />
                                      </button>
                                    )
                                  ) : '—'}
                                </td>
                                <td className="py-1.5 text-harbor text-right w-24 font-mono">KES {Number(p.amount).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-slate/60">No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Invoice modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-harbor/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-harbor">New Invoice</h3>
              <button onClick={() => setShowInvoiceForm(false)} className="text-slate hover:text-harbor">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate mb-1">Patient</label>
                <select
                  value={invoiceForm.patient}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, patient: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
                >
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.admission_id})</option>
                  ))}
                </select>
              </div>

              <p className="text-xs font-medium text-slate uppercase tracking-wide pt-2">Billable Items</p>
              {invoiceForm.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    placeholder="Description e.g. Rehab Package (Weekly)"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                  />
                  <input
                    type="number" min="1" placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    className="w-16 px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                  />
                  <input
                    type="number" min="0" placeholder="Price"
                    value={item.unit_price}
                    onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                    className="w-24 px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                  />
                  {invoiceForm.items.length > 1 && (
                    <button type="button" onClick={() => removeItemRow(i)} className="text-slate hover:text-red-500 p-2">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItemRow} className="text-xs text-serenity font-medium hover:text-harbor">
                + Add another item
              </button>

              {invoiceError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{invoiceError}</p>}

              <button
                type="submit"
                disabled={submittingInvoice}
                className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor transition-colors disabled:opacity-60 mt-2"
              >
                {submittingInvoice && <Loader2 className="w-4 h-4 animate-spin" />}
                {submittingInvoice ? 'Creating...' : 'Create Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment modal */}
      {paymentTarget && (
        <div className="fixed inset-0 bg-harbor/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-harbor">Record Payment</h3>
                <p className="text-xs text-slate mt-0.5">{paymentTarget.invoice_number} — Balance: KES {Number(paymentTarget.balance).toLocaleString()}</p>
              </div>
              <button onClick={() => setPaymentTarget(null)} className="text-slate hover:text-harbor">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate mb-1">Amount (KES)</label>
                <input
                  type="number" min="1" max={paymentTarget.balance}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate mb-1">Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value, mpesa_code: e.target.value === 'M-Pesa' ? paymentForm.mpesa_code : '' })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
                >
                  <option>Cash</option>
                  <option>M-Pesa</option>
                  <option>Bank Transfer</option>
                  <option>Card</option>
                </select>
              </div>

              {paymentForm.method === 'M-Pesa' && (
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">M-Pesa Code (optional now, can add later)</label>
                  <input
                    value={paymentForm.mpesa_code}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mpesa_code: e.target.value })}
                    placeholder="e.g. QAB1CD2EFG"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                  />
                </div>
              )}

              {paymentError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{paymentError}</p>}

              <button
                type="submit"
                disabled={submittingPayment}
                className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor transition-colors disabled:opacity-60 mt-2"
              >
                {submittingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                {submittingPayment ? 'Recording...' : 'Confirm Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crmService } from '../../services/crm';
import { commerceService } from '../../services/commerce';
import { Account, Contact } from '../../types/crm';
import { Product } from '../../types/commerce';
import { useToastStore } from '../../stores/toastStore';
import { 
  Button, Card, Input, Select, TextArea, Breadcrumbs 
} from '../../components/ui';
import { Plus, Trash, AlertTriangle, Save, ArrowLeft } from 'lucide-react';
import styles from './QuotationForm.module.css';

interface LineItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export function QuotationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const isEditMode = !!id;

  // Form Fields
  const [accountId, setAccountId] = useState('');
  const [contactId, setContactId] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(18); // default 18% GST
  const [validUntil, setValidUntil] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [notes, setNotes] = useState('');
  
  // Line Items state
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { product_id: '', quantity: 1, unit_price: 0, discount: 0 }
  ]);

  // Dropdown options
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [accRes, prodRes] = await Promise.all([
          crmService.getAccounts({ per_page: 100 }),
          commerceService.getProducts('', true) // only active products
        ]);
        setAccounts(accRes.data);
        setProducts(prodRes);

        if (isEditMode) {
          const quote = await commerceService.getQuotation(id);
          setAccountId(quote.account_id);
          setContactId(quote.contact_id || '');
          setDiscountType(quote.discount_type);
          setDiscountValue(quote.discount_value);
          setTaxRate(quote.tax_rate);
          setValidUntil(quote.valid_until ? quote.valid_until.split('T')[0] : '');
          setTermsConditions(quote.terms_conditions || '');
          setNotes(quote.notes || '');
          
          setLineItems(quote.items.map(it => ({
            product_id: it.product_id,
            quantity: it.quantity,
            unit_price: it.unit_price,
            discount: it.discount
          })));
        }
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Error Loading Data',
          message: 'Failed to initialize quotation form inputs.'
        });
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [id]);

  // Load and filter contacts when account changes
  useEffect(() => {
    if (!accountId) {
      setContacts([]);
      return;
    }
    const fetchContacts = async () => {
      try {
        const res = await crmService.getContacts({ account_id: accountId });
        setContacts(res.data);
      } catch (err) {
        console.error('Failed to load contacts for account', err);
      }
    };
    fetchContacts();
  }, [accountId]);

  // Handle line item field changes
  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...lineItems];
    
    if (field === 'product_id') {
      const prod = products.find(p => p.id === val);
      updated[index].product_id = val;
      updated[index].unit_price = prod ? prod.price : 0;
    } else {
      updated[index][field] = Number(val) as never;
    }

    setLineItems(updated);
  };

  const addItemRow = () => {
    setLineItems([...lineItems, { product_id: '', quantity: 1, unit_price: 0, discount: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  // Math Calculations (Live)
  const calculateTotals = () => {
    let subtotal = 0;
    lineItems.forEach(item => {
      const rowSub = item.unit_price * item.quantity;
      const rowTotal = Math.max(0, rowSub - item.discount);
      subtotal += rowTotal;
    });

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = discountedSubtotal * (taxRate / 100);
    const totalAmount = discountedSubtotal + taxAmount;

    // Calculate effective discount percentage
    const effectiveDiscountPct = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      effectiveDiscountPct
    };
  };

  const { subtotal, discountAmount, taxAmount, totalAmount, effectiveDiscountPct } = calculateTotals();
  const isHighDiscount = effectiveDiscountPct > 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      addToast({ type: 'warning', title: 'Validation Warning', message: 'Please select a company account.' });
      return;
    }

    const invalidItems = lineItems.filter(it => !it.product_id || it.quantity <= 0);
    if (invalidItems.length > 0) {
      addToast({ type: 'warning', title: 'Validation Warning', message: 'Please select a valid product and quantity for all items.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        account_id: accountId,
        contact_id: contactId || null,
        discount_type: discountType,
        discount_value: discountValue,
        tax_rate: taxRate,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        terms_conditions: termsConditions || null,
        notes: notes || null,
        items: lineItems
      };

      if (isEditMode) {
        await commerceService.updateQuotation(id, payload);
        addToast({ type: 'success', title: 'Quotation Updated', message: 'Quotation details saved successfully.' });
      } else {
        await commerceService.createQuotation(payload);
        addToast({ type: 'success', title: 'Quotation Created', message: 'New quotation successfully captured.' });
      }
      navigate('/quotations');
    } catch (err) {
      // toast is automatically displayed by apiClient
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading form inputs...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <Breadcrumbs items={[{ label: 'Home' }, { label: 'Quotations', href: '/quotations' }, { label: isEditMode ? 'Edit Quote' : 'New Quote' }]} />
        <h1 className={styles.title}>{isEditMode ? 'Edit Quotation Details' : 'Capture New Quotation'}</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        {/* Left main form section */}
        <div className={styles.formSection}>
          {/* Company Details */}
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Client Information</h2>
            </div>
            <div className={styles.formRow}>
              <Select
                label="Account / Company"
                options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                value={accountId}
                onChange={setAccountId}
                placeholder="Select company..."
                required
              />
              <Select
                label="Contact Person (Optional)"
                options={contacts.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))}
                value={contactId}
                onChange={setContactId}
                placeholder={accountId ? "Select contact..." : "Select account first..."}
                disabled={!accountId}
              />
            </div>
          </Card>

          {/* Quotation Line Items */}
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Line Items</h2>
            </div>
            
            <table className={styles.lineItemsTable}>
              <thead>
                <tr>
                  <th>Product / Service</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Qty</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Unit Price ($)</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Discount ($)</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Subtotal ($)</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => {
                  const itemSubtotal = item.unit_price * item.quantity;
                  const itemTotal = Math.max(0, itemSubtotal - item.discount);
                  
                  return (
                    <tr key={index} className={styles.itemRow}>
                      <td>
                        <Select
                          options={products.map(p => ({ value: p.id, label: p.name }))}
                          value={item.product_id}
                          onChange={(val) => handleItemChange(index, 'product_id', val)}
                          placeholder="Select product..."
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className={styles.numberInput}
                          min="1"
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          className={styles.numberInput}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                          className={styles.numberInput}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className={styles.priceDisplay}>
                        ${itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <button 
                          type="button" 
                          onClick={() => removeItemRow(index)}
                          className={styles.deleteBtn}
                          disabled={lineItems.length === 1}
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className={styles.addItemRow}>
              <Button type="button" variant="outline" size="sm" leftIcon={<Plus size={16} />} onClick={addItemRow}>
                Add Line Item
              </Button>
            </div>
          </Card>

          {/* Terms & Conditions / Notes */}
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Terms & Internal Notes</h2>
            </div>
            <div className={styles.formSection}>
              <TextArea
                label="Terms & Conditions"
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
                placeholder="Payment terms, delivery schedules, liability details..."
                rows={3}
              />
              <TextArea
                label="Internal Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes for internal reviews or delivery notes..."
                rows={2}
              />
            </div>
          </Card>
        </div>

        {/* Right side financial summary panel */}
        <div className={styles.formSection}>
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Financial Summary</h2>
            </div>

            <div className={styles.formSection}>
              <Input
                label="Valid Until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />

              <div className={styles.formRow}>
                <Select
                  label="Discount Type"
                  options={[
                    { value: 'percentage', label: 'Percent (%)' },
                    { value: 'fixed', label: 'Fixed ($)' }
                  ]}
                  value={discountType}
                  onChange={(val) => {
                    setDiscountType(val as any);
                    setDiscountValue(0);
                  }}
                />
                <Input
                  label="Discount Value"
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                  min="0"
                />
              </div>

              <Input
                label="Tax Rate / GST (%)"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                min="0"
                max="100"
              />

              {/* Calculations Block */}
              <div className={styles.summaryBlock}>
                <div className={styles.summaryRow}>
                  <span>Item Subtotal:</span>
                  <span>${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Header Discount:</span>
                  <span style={{ color: 'var(--text-danger)' }}>
                    -${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Tax ({taxRate}%):</span>
                  <span>${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.grandTotal}`}>
                  <span>Grand Total:</span>
                  <span className={styles.grandTotalAmount}>
                    ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* High Discount Warning card */}
          {isHighDiscount && (
            <div className={styles.warningAlert}>
              <AlertTriangle className={styles.warningIcon} size={20} />
              <div>
                <strong>High Discount Triggered ({effectiveDiscountPct.toFixed(1)}%)</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                  Discounts exceeding 15.0% require review. Saving this quote will transition its status to <strong>Pending Approval</strong>. It must be approved by a manager before it can be converted to an order.
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.formActions}>
            <Button type="button" variant="outline" onClick={() => navigate('/quotations')} leftIcon={<ArrowLeft size={16} />}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting} leftIcon={<Save size={16} />}>
              {isEditMode ? 'Update Quote' : 'Save Quote'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
export default QuotationForm;

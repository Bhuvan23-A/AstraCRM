import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { commerceService } from '../../services/commerce';
import { useToastStore } from '../../stores/toastStore';
import { Order, OrderStatus, PaymentStatus } from '../../types/commerce';
import { 
  Button, Card, Badge, Table, Breadcrumbs, Input, TextArea, Select 
} from '../../components/ui';
import { 
  ArrowLeft, Printer, FileText, ShoppingBag, Truck, CreditCard, Save 
} from 'lucide-react';
import styles from './OrderDetails.module.css';

export function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Editable fields
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pending');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState('');

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await commerceService.getOrder(id);
      setOrder(data);
      setShippingAddress(data.shipping_address || '');
      setBillingAddress(data.billing_address || '');
      setOrderStatus(data.status);
      setPaymentStatus(data.payment_status);
      setPaymentMethod(data.payment_method || '');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Loading Failed',
        message: 'Could not load order details from the database.'
      });
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handlePrint = () => {
    if (!order) return;
    const url = commerceService.getPrintOrderUrl(order.id);
    window.open(url, '_blank', 'width=800,height=900,scrollbars=yes');
  };

  const handleQuickStatusUpdate = async (field: 'status' | 'payment_status', val: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const payload = { [field]: val };
      const updated = await commerceService.updateOrder(order.id, payload);
      setOrder(updated);
      if (field === 'status') setOrderStatus(updated.status);
      if (field === 'payment_status') setPaymentStatus(updated.payment_status);
      
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Order ${field.replace('_', ' ')} is now ${val.toUpperCase()}.`
      });
    } catch (err) {
      // Toast displays error
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveAddresses = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const payload = {
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        payment_method: paymentMethod || null
      };
      const updated = await commerceService.updateOrder(order.id, payload);
      setOrder(updated);
      addToast({
        type: 'success',
        title: 'Details Saved',
        message: 'Shipping & billing coordinates updated successfully.'
      });
    } catch (err) {
      // Toast displays error
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading order details...</div>;
  }

  if (!order) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-danger)' }}>Order record not found.</div>;
  }

  return (
    <div className={styles.container}>
      {/* Back button */}
      <div className={styles.backHeader}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/orders')}>
          Back to Directory
        </Button>
      </div>

      <div className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <Breadcrumbs items={[{ label: 'Home' }, { label: 'Orders', href: '/orders' }, { label: order.order_number }]} />
          <h1 className={styles.title}>{order.order_number}</h1>
        </div>

        <div className={styles.actionPanel}>
          <Button variant="outline" leftIcon={<Printer size={16} />} onClick={handlePrint}>
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Main split */}
      <div className={styles.grid}>
        <div className={styles.leftSection}>
          {/* Order Details Profiler Card */}
          <Card>
            <div className={styles.detailsGrid}>
              <div className={styles.infoBlock}>
                <h3>Client Profile</h3>
                <strong>{order.account?.name || 'Deleted Company'}</strong>
                {order.contact && (
                  <>
                    <p>Contact: {order.contact.first_name} {order.contact.last_name}</p>
                    <p>Email: {order.contact.email}</p>
                    <p>Phone: {order.contact.phone}</p>
                  </>
                )}
              </div>
              <div className={styles.infoBlock}>
                <h3>Order Information</h3>
                <p><strong>Payment Status:</strong> <Badge variant={order.payment_status === 'paid' ? 'success' : order.payment_status === 'unpaid' ? 'danger' : 'warning'}>{order.payment_status.replace('_', ' ').toUpperCase()}</Badge></p>
                <p><strong>Shipment Status:</strong> <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}>{order.status.toUpperCase()}</Badge></p>
                {order.quotation && (
                  <p>
                    <strong>Source Quote:</strong>{' '}
                    <a 
                      href={`/quotations/${order.quotation_id}`} 
                      className={styles.link}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/quotations/${order.quotation_id}`);
                      }}
                    >
                      <FileText size={12} /> {order.quotation.quote_number}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Editable Coordinates Card */}
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Shipping & Dispatch Instructions</h2>
            </div>
            
            <div className={styles.editableAddress}>
              <div className={styles.detailsGrid}>
                <TextArea
                  label="Billing Address"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  rows={3}
                />
                <TextArea
                  label="Shipping Address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={3}
                />
              </div>

              <div className={styles.detailsGrid} style={{ alignItems: 'flex-end', marginTop: '12px' }}>
                <Input
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="e.g. Bank Transfer, Stripe, Purchase Order"
                />
                <Button 
                  type="button" 
                  variant="primary" 
                  leftIcon={<Save size={16} />} 
                  onClick={handleSaveAddresses}
                  isLoading={updating}
                  style={{ width: 'fit-content' }}
                >
                  Save Shipping Details
                </Button>
              </div>
            </div>
          </Card>

          {/* Order Items Table */}
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Invoice Items</h2>
            </div>

            <table className={styles.productsTable}>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Product / Description</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Qty</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{item.product?.name || 'Deleted Product'}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        SKU: {item.product?.sku || 'N/A'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }} className={styles.priceText}>
                      ${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }} className={styles.priceText}>
                      ${Number(item.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Totals */}
            <div className={styles.summaryBlock}>
              <div className={styles.summaryRow}>
                <span>Net Total:</span>
                <span>${Number(order.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>GST Tax (18%):</span>
                <span>${Number(order.tax_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.grandTotal}`}>
                <span>Invoice Total:</span>
                <span className={styles.grandTotalAmount}>
                  ${Number(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right side quick management sidebar */}
        <div className={styles.sidebarCard}>
          {/* Status Selectors */}
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Status Panel</h2>
            </div>
            
            <div className={styles.statusForms}>
              <Select
                label="Delivery Status"
                options={[
                  { value: 'pending', label: 'PENDING' },
                  { value: 'confirmed', label: 'CONFIRMED' },
                  { value: 'processing', label: 'PROCESSING' },
                  { value: 'shipped', label: 'SHIPPED' },
                  { value: 'delivered', label: 'DELIVERED' },
                  { value: 'cancelled', label: 'CANCELLED' }
                ]}
                value={orderStatus}
                onChange={(val) => handleQuickStatusUpdate('status', val)}
                disabled={updating}
              />

              <Select
                label="Payment Status"
                options={[
                  { value: 'unpaid', label: 'UNPAID' },
                  { value: 'partially_paid', label: 'PARTIALLY PAID' },
                  { value: 'paid', label: 'PAID' },
                  { value: 'refunded', label: 'REFUNDED' }
                ]}
                value={paymentStatus}
                onChange={(val) => handleQuickStatusUpdate('payment_status', val)}
                disabled={updating}
              />
            </div>
          </Card>

          {/* Profile metadata */}
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Sales Profile</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Order ID:</span>
                <span className={styles.metaValue}>{order.id.substring(0, 8)}...</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Date Created:</span>
                <span className={styles.metaValue}>
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Last Changed:</span>
                <span className={styles.metaValue}>
                  {new Date(order.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default OrderDetails;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { commerceService } from '../../services/commerce';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { Quotation } from '../../types/commerce';
import { 
  Button, Card, Badge, Table, Breadcrumbs, Modal, TextArea 
} from '../../components/ui';
import { 
  ArrowLeft, Edit, ShieldAlert, Sparkles, CheckCircle2, 
  Trash, Printer, Shuffle, XCircle, CheckSquare 
} from 'lucide-react';
import styles from './QuotationDetails.module.css';

export function QuotationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();

  const [quote, setQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionsLoading, setActionsLoading] = useState(false);

  // Approval Modal states
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isApproveAction, setIsApproveAction] = useState(true); // true = approve, false = reject
  const [approvalNotes, setApprovalNotes] = useState('');

  const loadQuote = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await commerceService.getQuotation(id);
      setQuote(data);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Loading Failed',
        message: 'Could not load quotation details from the database.'
      });
      navigate('/quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuote();
  }, [id]);

  const handlePrint = () => {
    if (!quote) return;
    const url = commerceService.getPrintQuotationUrl(quote.id);
    window.open(url, '_blank', 'width=800,height=900,scrollbars=yes');
  };

  const handleOpenApproval = (approve: boolean) => {
    setIsApproveAction(approve);
    setApprovalNotes('');
    setIsApprovalModalOpen(true);
  };

  const submitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;
    setActionsLoading(true);
    try {
      await commerceService.approveQuotation(quote.id, isApproveAction, approvalNotes);
      addToast({
        type: 'success',
        title: isApproveAction ? 'Quote Approved' : 'Quote Rejected',
        message: `The quotation status has been updated successfully.`
      });
      setIsApprovalModalOpen(false);
      loadQuote();
    } catch (err) {
      // API client toast handles display
    } finally {
      setActionsLoading(false);
    }
  };

  const convertToOrder = async () => {
    if (!quote) return;
    setActionsLoading(true);
    try {
      const order = await commerceService.convertQuotationToOrder(quote.id);
      addToast({
        type: 'success',
        title: 'Order Created',
        message: 'The quotation has been successfully converted into an Order.'
      });
      navigate(`/orders/${order.id}`);
    } catch (err) {
      // Toast displays error
    } finally {
      setActionsLoading(false);
    }
  };

  const deleteQuote = async () => {
    if (!quote) return;
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    setActionsLoading(true);
    try {
      await commerceService.deleteQuotation(quote.id);
      addToast({ type: 'success', title: 'Quotation Deleted', message: 'The quotation record was successfully removed.' });
      navigate('/quotations');
    } catch (err) {
      // Toast displays error
    } finally {
      setActionsLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading quotation details...</div>;
  }

  if (!quote) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-danger)' }}>Quotation not found.</div>;
  }

  // Check roles: Only super admin, admin, and sales manager can approve/reject
  const isManagerOrAdmin = user && ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(user.role);

  return (
    <div className={styles.container}>
      {/* Back link */}
      <div className={styles.backHeader}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/quotations')}>
          Back to Directory
        </Button>
      </div>

      <div className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <Breadcrumbs items={[{ label: 'Home' }, { label: 'Quotations', href: '/quotations' }, { label: quote.quote_number }]} />
          <h1 className={styles.title}>{quote.quote_number}</h1>
        </div>

        <div className={styles.actionPanel}>
          <Button variant="outline" leftIcon={<Printer size={16} />} onClick={handlePrint}>
            Print / PDF
          </Button>

          {quote.status === 'draft' && (
            <Button variant="outline" leftIcon={<Edit size={16} />} onClick={() => navigate(`/quotations/${quote.id}/edit`)}>
              Edit Details
            </Button>
          )}

          {['approved', 'sent'].includes(quote.status) && (
            <Button 
              variant="primary" 
              leftIcon={<Shuffle size={16} />} 
              onClick={convertToOrder}
              isLoading={actionsLoading}
            >
              Convert to Order
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid split */}
      <div className={styles.grid}>
        <div className={styles.leftSection}>
          {/* Status Banners */}
          {quote.status === 'pending_approval' && (
            <div className={`${styles.alertBanner} ${styles.warning}`}>
              <ShieldAlert className={styles.alertIcon} size={20} />
              <div>
                <strong>Awaiting Manager Review</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  This quote triggers a high discount warning ({((quote.discount_amount / quote.subtotal) * 100).toFixed(1)}%). It must be approved by a Sales Manager or Administrator before it can be processed.
                </p>
                {isManagerOrAdmin ? (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <Button size="sm" variant="success" leftIcon={<CheckSquare size={14} />} onClick={() => handleOpenApproval(true)}>
                      Approve Quote
                    </Button>
                    <Button size="sm" variant="danger" leftIcon={<XCircle size={14} />} onClick={() => handleOpenApproval(false)}>
                      Reject Quote
                    </Button>
                  </div>
                ) : (
                  <p style={{ margin: '8px 0 0 0', fontStyle: 'italic', fontSize: '12px', opacity: 0.8 }}>
                    Only users with administrative or manager privileges can authorize this quotation.
                  </p>
                )}
              </div>
            </div>
          )}

          {quote.status === 'accepted' && (
            <div className={`${styles.alertBanner} ${styles.success}`}>
              <CheckCircle2 className={styles.alertIcon} size={20} />
              <div>
                <strong>Quotation Accepted & Converted</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  This quote has been closed and successfully converted into a sales order.
                </p>
              </div>
            </div>
          )}

          {/* Quotation Details Card */}
          <Card>
            <div className={styles.detailsGrid}>
              <div className={styles.infoBlock}>
                <h3>Client Billing Info</h3>
                <strong>{quote.account?.name || 'Deleted Company'}</strong>
                {quote.contact && (
                  <>
                    <p>Contact: {quote.contact.first_name} {quote.contact.last_name}</p>
                    <p>Email: {quote.contact.email}</p>
                    <p>Phone: {quote.contact.phone}</p>
                  </>
                )}
              </div>
              <div className={styles.infoBlock}>
                <h3>Quote Meta Info</h3>
                <p><strong>Status:</strong> <Badge variant={quote.status === 'approved' || quote.status === 'accepted' ? 'success' : quote.status === 'pending_approval' ? 'warning' : 'default'}>{quote.status.toUpperCase()}</Badge></p>
                <p><strong>Expires On:</strong> {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'No Expiration Date'}</p>
                <p><strong>Discount Type:</strong> {quote.discount_type.toUpperCase()}</p>
              </div>
            </div>
          </Card>

          {/* Line items list */}
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Quoted Products & Services</h2>
            </div>
            
            <table className={styles.productsTable}>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Product Name / SKU</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Qty</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Discount</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
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
                      ${Number(item.discount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }} className={styles.priceText}>
                      ${Number(item.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals box */}
            <div className={styles.summaryBlock}>
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>${Number(quote.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Quote Discount:</span>
                <span style={{ color: 'var(--text-danger)' }}>
                  -${Number(quote.discount_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>GST Tax ({quote.tax_rate}%):</span>
                <span>${Number(quote.tax_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.grandTotal}`}>
                <span>Total Quote Value:</span>
                <span className={styles.grandTotalAmount}>
                  ${Number(quote.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </Card>

          {/* Terms conditions */}
          {quote.terms_conditions && (
            <Card>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Terms & Conditions</h2>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {quote.terms_conditions}
              </p>
            </Card>
          )}
        </div>

        {/* Right side history/meta card */}
        <div className={styles.sidebarCard}>
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Information Profile</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Quote ID:</span>
                <span className={styles.metaValue}>{quote.id.substring(0, 8)}...</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Created At:</span>
                <span className={styles.metaValue}>
                  {new Date(quote.created_at).toLocaleString()}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Last Updated:</span>
                <span className={styles.metaValue}>
                  {new Date(quote.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Danger zone delete */}
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle} style={{ color: 'var(--text-danger)' }}>Danger Settings</h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
              Once you delete this quotation record, it will be soft-deleted and removed from active index list.
            </p>
            <Button 
              variant="outline" 
              className={styles.actionButton}
              style={{ color: 'var(--text-danger)', borderColor: 'var(--text-danger)' }}
              leftIcon={<Trash size={16} />}
              onClick={deleteQuote}
              isLoading={actionsLoading}
            >
              Delete Quotation
            </Button>
          </Card>
        </div>
      </div>

      {/* Approval Notes / Actions Modal */}
      <Modal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} title={isApproveAction ? "Approve Quotation" : "Reject Quotation"}>
        <form onSubmit={submitApproval} className={styles.approvalNotesForm}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
            {isApproveAction 
              ? "Are you sure you want to approve this quote? This will allow the sales executive to convert it into a final order." 
              : "Please specify the rejection reasons below for the sales executive to revise the quote details."}
          </p>
          <TextArea
            label="Internal Review Notes (Optional)"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Add comments on why this quote is approved or rejected..."
            rows={3}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={isApproveAction ? "success" : "danger"} isLoading={actionsLoading}>
              {isApproveAction ? "Authorize Approval" : "Submit Rejection"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default QuotationDetails;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { commerceService } from '../../services/commerce';
import { Order } from '../../types/commerce';
import { 
  Button, Card, Badge, Table, Breadcrumbs, Select, SearchInput 
} from '../../components/ui';
import { ShoppingBag, Hourglass, DollarSign, Truck, ArrowRight } from 'lucide-react';
import styles from './Orders.module.css';

export function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Stat summary calculations
  const [stats, setStats] = useState({
    totalCount: 0,
    pendingShipment: 0,
    paidValue: 0,
    unpaidCount: 0
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await commerceService.getOrders(
        statusFilter || undefined,
        paymentFilter || undefined
      );
      setOrders(data);
      
      // Calculate statistics
      const totalCount = data.length;
      const pendingShipment = data.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length;
      const paidValue = data
        .filter(o => o.payment_status === 'paid')
        .reduce((acc, o) => acc + Number(o.total_amount), 0);
      const unpaidCount = data.filter(o => o.payment_status === 'unpaid').length;

      setStats({ totalCount, pendingShipment, paidValue, unpaidCount });
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter]);

  // Frontend filter for search
  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(term) ||
      (o.account?.name || '').toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      key: 'order_number',
      title: 'Order #',
      render: (val: string, row: Order) => (
        <a 
          href={`/orders/${row.id}`} 
          className={styles.link}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/orders/${row.id}`);
          }}
        >
          <ShoppingBag size={14} /> {val}
        </a>
      )
    },
    {
      key: 'account',
      title: 'Company / Account',
      render: (_: any, row: Order) => row.account?.name || <span className={styles.empty}>Deleted Account</span>
    },
    {
      key: 'created_at',
      title: 'Order Date',
      render: (val: string) => new Date(val).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },
    {
      key: 'total_amount',
      title: 'Grand Total',
      render: (val: number) => <span className={styles.priceText}>${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    },
    {
      key: 'status',
      title: 'Delivery Status',
      render: (val: string) => {
        let variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
        if (val === 'delivered') variant = 'success';
        if (val === 'cancelled') variant = 'danger';
        if (['pending', 'confirmed'].includes(val)) variant = 'warning';
        if (val === 'processing') variant = 'info';
        
        return <Badge variant={variant}>{val.toUpperCase()}</Badge>;
      }
    },
    {
      key: 'payment_status',
      title: 'Payment',
      render: (val: string) => {
        let variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
        if (val === 'paid') variant = 'success';
        if (val === 'unpaid') variant = 'danger';
        if (val === 'partially_paid') variant = 'warning';
        if (val === 'refunded') variant = 'info';
        
        const label = val.replace('_', ' ').toUpperCase();
        return <Badge variant={variant}>{label}</Badge>;
      }
    },
    {
      key: 'actions',
      title: '',
      render: (_: any, row: Order) => (
        <div className={styles.rowActions}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/orders/${row.id}`)}
            rightIcon={<ArrowRight size={14} />}
          >
            Manage
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <Breadcrumbs items={[{ label: 'Home' }, { label: 'Orders' }]} />
          <h1 className={styles.title}>Order Management</h1>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className={styles.statsGrid}>
        <Card variant="stat" className={styles.statCard}>
          <div className={styles.statIcon}><ShoppingBag size={20} /></div>
          <div>
            <div className={styles.statTitle}>Total Orders</div>
            <div className={styles.statValue}>{stats.totalCount}</div>
          </div>
        </Card>

        <Card variant="stat" className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--brand-info)', borderColor: 'var(--brand-info-subtle)' }}>
            <Truck size={20} />
          </div>
          <div>
            <div className={styles.statTitle}>Pending Shipments</div>
            <div className={styles.statValue}>{stats.pendingShipment}</div>
          </div>
        </Card>

        <Card variant="stat" className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--brand-success)', borderColor: 'var(--brand-success-subtle)' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div className={styles.statTitle}>Revenue Collected</div>
            <div className={styles.statValue}>
              ${stats.paidValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </Card>

        <Card variant="stat" className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--text-danger)', borderColor: 'var(--border-subtle)' }}>
            <Hourglass size={20} />
          </div>
          <div>
            <div className={styles.statTitle}>Unpaid Invoices</div>
            <div className={styles.statValue}>{stats.unpaidCount}</div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <SearchInput
            placeholder="Search orders by order number or account name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.selectFilter}>
          <Select
            options={[
              { value: '', label: 'All Shipments' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />
        </div>
        <div className={styles.selectFilter}>
          <Select
            options={[
              { value: '', label: 'All Payments' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'partially_paid', label: 'Partially Paid' },
              { value: 'paid', label: 'Paid' },
              { value: 'refunded', label: 'Refunded' }
            ]}
            value={paymentFilter}
            onChange={(val) => setPaymentFilter(val)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredOrders}
          isLoading={loading}
          emptyMessage="No order records found."
        />
      </Card>
    </div>
  );
}
export default Orders;

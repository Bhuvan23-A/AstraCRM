import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { commerceService } from '../../services/commerce';
import { Quotation } from '../../types/commerce';
import { 
  Button, Card, Badge, Table, Breadcrumbs, Select, SearchInput 
} from '../../components/ui';
import { FileText, Plus, Hourglass, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import styles from './Quotations.module.css';

export function Quotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Stat summary calculations
  const [stats, setStats] = useState({
    totalCount: 0,
    totalValue: 0,
    pendingCount: 0,
    approvedValue: 0
  });

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const data = await commerceService.getQuotations(statusFilter || undefined);
      setQuotations(data);
      
      // Calculate stats based on loaded data
      const totalCount = data.length;
      const totalValue = data.reduce((acc, q) => acc + Number(q.total_amount), 0);
      const pendingCount = data.filter(q => q.status === 'pending_approval').length;
      const approvedValue = data
        .filter(q => ['approved', 'sent', 'accepted'].includes(q.status))
        .reduce((acc, q) => acc + Number(q.total_amount), 0);

      setStats({ totalCount, totalValue, pendingCount, approvedValue });
    } catch (err) {
      console.error('Failed to load quotations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter]);

  // Apply frontend search (search by quote number or account name)
  const filteredQuotations = quotations.filter(q => {
    const term = searchTerm.toLowerCase();
    return (
      q.quote_number.toLowerCase().includes(term) ||
      (q.account?.name || '').toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      key: 'quote_number',
      title: 'Quote #',
      render: (val: string, row: Quotation) => (
        <a 
          href={`/quotations/${row.id}`} 
          className={styles.link}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/quotations/${row.id}`);
          }}
        >
          <FileText size={14} /> {val}
        </a>
      )
    },
    {
      key: 'account',
      title: 'Company / Account',
      render: (_: any, row: Quotation) => row.account?.name || <span className={styles.empty}>Deleted Account</span>
    },
    {
      key: 'created_at',
      title: 'Date Created',
      render: (val: string) => new Date(val).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },
    {
      key: 'valid_until',
      title: 'Expires On',
      render: (val: string | null) => val ? new Date(val).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : <span className={styles.empty}>No Expiry</span>
    },
    {
      key: 'total_amount',
      title: 'Total Value',
      render: (val: number) => <span className={styles.priceText}>${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    },
    {
      key: 'status',
      title: 'Status',
      render: (val: string) => {
        let variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
        if (val === 'approved') variant = 'success';
        if (val === 'accepted') variant = 'success';
        if (val === 'pending_approval') variant = 'warning';
        if (val === 'rejected') variant = 'danger';
        if (val === 'sent') variant = 'info';
        
        // Map display label
        const displayLabel = val.replace('_', ' ').toUpperCase();
        return <Badge variant={variant}>{displayLabel}</Badge>;
      }
    },
    {
      key: 'actions',
      title: '',
      render: (_: any, row: Quotation) => (
        <div className={styles.rowActions}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/quotations/${row.id}`)}
            rightIcon={<ArrowRight size={14} />}
          >
            View Details
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <Breadcrumbs items={[{ label: 'Home' }, { label: 'Quotations' }]} />
          <h1 className={styles.title}>Quotation Management</h1>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => navigate('/quotations/new')}>
          Create Quotation
        </Button>
      </div>

      {/* Summary Stat Grid */}
      <div className={styles.statsGrid}>
        <Card variant="stat" className={styles.statCard}>
          <div className={styles.statIcon}><FileText size={20} /></div>
          <div>
            <div className={styles.statTitle}>Total Quotations</div>
            <div className={styles.statValue}>{stats.totalCount}</div>
          </div>
        </Card>
        
        <Card variant="stat" className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--text-primary)' }}><FileText size={20} /></div>
          <div>
            <div className={styles.statTitle}>Total Quoted Value</div>
            <div className={styles.statValue}>
              ${stats.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </Card>

        <Card variant="stat" className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--brand-warning)', borderColor: 'var(--brand-warning-subtle)' }}>
            <Hourglass size={20} />
          </div>
          <div>
            <div className={styles.statTitle}>Pending Approval</div>
            <div className={styles.statValue}>{stats.pendingCount}</div>
          </div>
        </Card>

        <Card variant="stat" className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--brand-success)', borderColor: 'var(--brand-success-subtle)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className={styles.statTitle}>Approved/Closed Value</div>
            <div className={styles.statValue}>
              ${stats.approvedValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <SearchInput
            placeholder="Search quotations by quote number or account name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.selectFilter}>
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'pending_approval', label: 'Pending Approval' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'sent', label: 'Sent' },
              { value: 'accepted', label: 'Accepted' }
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />
        </div>
      </div>

      {/* Main Quotations Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredQuotations}
          isLoading={loading}
          emptyMessage="No quotations found."
        />
      </Card>
    </div>
  );
}

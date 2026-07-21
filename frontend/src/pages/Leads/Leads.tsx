import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads } from '../../hooks/useCRM';
import { crmService } from '../../services/crm';
import { useToastStore } from '../../stores/toastStore';
import { Lead } from '../../types/crm';
import { 
  Button, Input, Table, Modal, Card, 
  Badge, SearchInput, Pagination, Breadcrumbs, Select, TextArea
} from '../../components/ui';
import { Target, Plus, Flame, Sparkles, TrendingUp, Trash } from 'lucide-react';
import styles from './Leads.module.css';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'lost', label: 'Lost' },
  { value: 'converted', label: 'Converted' }
];

const SOURCE_OPTIONS = [
  { value: 'Website', label: 'Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Email Campaign', label: 'Email Campaign' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Manual', label: 'Manual Entry' },
  { value: 'Other', label: 'Other' }
];

export const Leads: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  
  // Page search/filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch leads query
  const { data: leads, loading, refetch, meta } = useLeads({
    page,
    per_page: 10,
    search,
    status,
    source,
    sort_by: sortKey,
    sort_order: sortOrder
  });

  // Modal control states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [description, setDescription] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate warning states
  const [dupWarnings, setDupWarnings] = useState<any[]>([]);

  const handleCheckDuplicates = async () => {
    if (!email && !phone) return;
    try {
      const res = await crmService.checkLeadDuplicates(email || undefined, phone || undefined);
      if (res.success && res.data) {
        setDupWarnings(res.data);
      }
    } catch (err) {}
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      addToast({ type: 'warning', title: 'Validation Warning', message: 'First name and Last name are required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const tagNames = tagsString.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const res = await crmService.createLead({
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        phone: phone || undefined,
        company_name: companyName || undefined,
        source: leadSource || undefined,
        description: description || undefined,
        tag_names: tagNames,
        status: 'new'
      });

      if (res.success && res.data) {
        addToast({ 
          type: 'success', 
          title: 'Lead Captured', 
          message: `Captured lead "${firstName} ${lastName}" with score ${res.data.score}.` 
        });
        setIsCreateOpen(false);
        resetForm();
        refetch();
      }
    } catch (err) {} finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete lead "${name}"?`)) return;

    try {
      const res = await crmService.deleteLead(id);
      if (res.success) {
        addToast({ type: 'success', title: 'Lead Deleted', message: `Lead "${name}" has been deleted.` });
        refetch();
      }
    } catch (err) {}
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCompanyName('');
    setLeadSource('');
    setDescription('');
    setTagsString('');
    setDupWarnings([]);
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortOrder(direction);
  };

  // Helper to render Lead score badges with color ranges
  const renderScoreBadge = (score: number) => {
    if (score >= 35) {
      return (
        <span className={`${styles.badgeScore} ${styles.hotScore}`}>
          <Flame size={12} style={{ marginRight: '4px' }} /> {score} (Hot)
        </span>
      );
    } else if (score >= 15) {
      return (
        <span className={`${styles.badgeScore} ${styles.warmScore}`}>
          <Sparkles size={12} style={{ marginRight: '4px' }} /> {score} (Warm)
        </span>
      );
    } else {
      return (
        <span className={`${styles.badgeScore} ${styles.coldScore}`}>
          {score} (Cold)
        </span>
      );
    }
  };

  // Table Columns config
  const columns = [
    {
      key: 'name',
      title: 'Contact Name',
      sortable: true,
      render: (_: any, row: Lead) => (
        <span className={styles.fullName}>
          {row.first_name} {row.last_name}
        </span>
      )
    },
    {
      key: 'company_name',
      title: 'Company/Organization',
      sortable: true,
      render: (val: string) => val || <span className={styles.empty}>—</span>
    },
    {
      key: 'score',
      title: 'Score',
      sortable: true,
      render: (score: number) => renderScoreBadge(score)
    },
    {
      key: 'source',
      title: 'Source',
      render: (val: string) => val ? <Badge variant="default">{val}</Badge> : <span className={styles.empty}>—</span>
    },
    {
      key: 'status',
      title: 'Status',
      render: (val: string) => {
        let badgeVariant: 'primary' | 'success' | 'warning' | 'danger' | 'default' = 'default';
        if (val === 'new') badgeVariant = 'primary';
        if (val === 'contacted') badgeVariant = 'info';
        if (val === 'qualified') badgeVariant = 'success';
        if (val === 'lost') badgeVariant = 'danger';
        if (val === 'converted') badgeVariant = 'success';
        
        return <Badge variant={badgeVariant}>{val}</Badge>;
      }
    },
    {
      key: 'actions',
      title: '',
      render: (_: any, row: Lead) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => handleDeleteLead(row.id, `${row.first_name} ${row.last_name}`, e)}
          className={styles.deleteBtn}
        >
          <Trash size={14} />
        </Button>
      )
    }
  ];

  // Derive counts for stat summary cards
  const totalLeads = meta?.total || 0;
  const hotLeadsCount = leads?.filter(l => l.score >= 35 && l.status !== 'converted').length || 0;
  const convertedCount = leads?.filter(l => l.status === 'converted').length || 0;

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <Breadcrumbs items={[{ label: 'Home' }, { label: 'Leads' }]} />
          <h1 className={styles.title}>Leads Database</h1>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsCreateOpen(true)}>
          Capture Lead
        </Button>
      </div>

      {/* Leads Stats Header Grid */}
      <div className={styles.statsGrid}>
        <Card variant="stat" className={styles.statCard}>
          <div className={styles.statIcon}><Target size={20} /></div>
          <div>
            <div className={styles.statTitle}>Total Leads</div>
            <div className={styles.statValue}>{totalLeads}</div>
          </div>
        </Card>

        <Card variant="stat" className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconHot}`}><Flame size={20} /></div>
          <div>
            <div className={styles.statTitle}>Active Hot Leads</div>
            <div className={styles.statValue}>{hotLeadsCount}</div>
          </div>
        </Card>

        <Card variant="stat" className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconConv}`}><TrendingUp size={20} /></div>
          <div>
            <div className={styles.statTitle}>Converted Accounts</div>
            <div className={styles.statValue}>{convertedCount}</div>
          </div>
        </Card>
      </div>

      {/* Advanced filters card */}
      <Card className={styles.filterCard}>
        <div className={styles.filters}>
          <SearchInput 
            value={search} 
            onChange={(val) => { setSearch(val); setPage(1); }} 
            placeholder="Search leads by name, email, or company..."
            className={styles.searchInput}
          />
          
          <div className={styles.selectWrapper}>
            <Select 
              options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTIONS]}
              value={status}
              onChange={(val) => { setStatus(val); setPage(1); }}
              placeholder="Filter Status"
            />
          </div>

          <div className={styles.selectWrapper}>
            <Select 
              options={[{ value: '', label: 'All Sources' }, ...SOURCE_OPTIONS]}
              value={source}
              onChange={(val) => { setSource(val); setPage(1); }}
              placeholder="Filter Source"
            />
          </div>
        </div>
      </Card>

      {/* Leads lists data table */}
      <Card className={styles.tableCard}>
        <Table 
          columns={columns}
          data={leads || []}
          loading={loading}
          onRowClick={(row) => navigate(`/leads/${row.id}`)}
          onSort={handleSort}
          sortKey={sortKey}
          sortDirection={sortOrder}
          emptyMessage="No leads found. Capture some leads from forms to start!"
        />
        
        {meta && meta.total_pages > 1 && (
          <div className={styles.paginationWrapper}>
            <Pagination 
              currentPage={page}
              totalPages={meta.total_pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      {/* Create Lead Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Capture New Lead">
        <form onSubmit={handleCreateLead} className={styles.form}>
          
          {dupWarnings.length > 0 && (
            <div className={styles.warningAlert}>
              <h4 className={styles.warningTitle}>Potential Duplicate Warning:</h4>
              <ul className={styles.warningList}>
                {dupWarnings.map((w, idx) => <li key={idx}>{w.message}</li>)}
              </ul>
            </div>
          )}

          <div className={styles.formRow}>
            <Input 
              label="First Name *" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              placeholder="e.g. Mike" 
              required
            />
            <Input 
              label="Last Name *" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              placeholder="e.g. Peterson" 
              required
            />
          </div>

          <div className={styles.formRow}>
            <Input 
              label="Email Address" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              onBlur={handleCheckDuplicates}
              placeholder="e.g. mike@company.com" 
            />
            <Input 
              label="Phone Number" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              onBlur={handleCheckDuplicates}
              placeholder="e.g. +1 555 333 4444" 
            />
          </div>

          <div className={styles.formRow}>
            <Input 
              label="Company / Organization" 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              placeholder="e.g. Peterson Retail" 
            />
            <div className={styles.inputField}>
              <label className={styles.inputLabel}>Lead Source</label>
              <Select 
                options={SOURCE_OPTIONS}
                value={leadSource}
                onChange={setLeadSource}
                placeholder="Select Source"
              />
            </div>
          </div>

          <Input 
            label="Tags (Comma separated)" 
            value={tagsString} 
            onChange={(e) => setTagsString(e.target.value)} // Fix naming discrepancy
            placeholder="e.g. Warm, Event, Retail" 
          />

          <TextArea 
            label="Description / Context" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Provide context on how this lead was captured..." 
          />

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Capture Lead
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

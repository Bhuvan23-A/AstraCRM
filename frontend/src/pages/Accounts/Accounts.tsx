import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts, useTags } from '../../hooks/useCRM';
import { crmService } from '../../services/crm';
import { useToastStore } from '../../stores/toastStore';
import { 
  Button, Input, TextArea, Select, Table, 
  Modal, Card, Badge, SearchInput, Pagination, Breadcrumbs
} from '../../components/ui';
import { Building, Plus, Trash, ExternalLink } from 'lucide-react';
import styles from './Accounts.module.css';

const INDUSTRY_OPTIONS = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Education', label: 'Education' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Services', label: 'Services' },
  { value: 'Other', label: 'Other' }
];

export const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  
  // Page search/filter states
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Create modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRevenue, setNewRevenue] = useState('');
  const [newEmployees, setNewEmployees] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTagsString, setNewTagsString] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch accounts query
  const { data: accounts, loading, refetch, meta } = useAccounts({
    page,
    per_page: 10,
    search,
    industry,
    sort_by: sortKey,
    sort_order: sortOrder
  });

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortOrder(direction);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      addToast({ type: 'warning', title: 'Validation Warning', message: 'Account name is required' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const tagNames = newTagsString.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const res = await crmService.createAccount({
        name: newName,
        industry: newIndustry || undefined,
        website: newWebsite || undefined,
        phone: newPhone || undefined,
        annual_revenue: newRevenue ? parseFloat(newRevenue) : undefined,
        employees_count: newEmployees ? parseInt(newEmployees) : undefined,
        description: newDescription || undefined,
        tag_names: tagNames
      });

      if (res.success) {
        addToast({ type: 'success', title: 'Account Created', message: `Account "${newName}" created successfully.` });
        setIsCreateOpen(false);
        resetForm();
        refetch();
      }
    } catch (err: any) {
      // Errors handled by toast in apiClient
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to details row click
    if (!window.confirm(`Are you sure you want to delete account "${name}"?`)) return;

    try {
      const res = await crmService.deleteAccount(id);
      if (res.success) {
        addToast({ type: 'success', title: 'Account Deleted', message: `Account "${name}" deleted.` });
        refetch();
      }
    } catch (err) {}
  };

  const resetForm = () => {
    setNewName('');
    setNewIndustry('');
    setNewWebsite('');
    setNewPhone('');
    setNewRevenue('');
    setNewEmployees('');
    setNewDescription('');
    setNewTagsString('');
  };

  // Table Columns config
  const columns = [
    {
      key: 'name',
      title: 'Company Name',
      sortable: true,
      render: (val: string, row: any) => (
        <span className={styles.companyNameLink}>
          {val}
        </span>
      )
    },
    {
      key: 'industry',
      title: 'Industry',
      sortable: true,
      render: (val: string) => val ? <Badge variant="info">{val}</Badge> : <span className={styles.empty}>—</span>
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (val: string) => val || <span className={styles.empty}>—</span>
    },
    {
      key: 'website',
      title: 'Website',
      render: (val: string) => val ? (
        <a href={val.startsWith('http') ? val : `https://${val}`} target="_blank" rel="noreferrer" className={styles.link} onClick={e => e.stopPropagation()}>
          {val} <ExternalLink size={12} style={{ marginLeft: '4px' }} />
        </a>
      ) : <span className={styles.empty}>—</span>
    },
    {
      key: 'tags',
      title: 'Tags',
      render: (tags: any[]) => (
        <div className={styles.tagsContainer}>
          {tags?.map(t => (
            <span key={t.id} className={styles.tag} style={{ backgroundColor: t.color }}>{t.name}</span>
          )) || <span className={styles.empty}>—</span>}
        </div>
      )
    },
    {
      key: 'actions',
      title: '',
      render: (_: any, row: any) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => handleDeleteAccount(row.id, row.name, e)}
          className={styles.deleteBtn}
        >
          <Trash size={14} />
        </Button>
      )
    }
  ];

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <Breadcrumbs items={[{ label: 'Home' }, { label: 'Accounts' }]} />
          <h1 className={styles.title}>Accounts Directory</h1>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsCreateOpen(true)}>
          New Account
        </Button>
      </div>

      {/* Stat Cards summary */}
      <div className={styles.statsGrid}>
        <Card variant="stat" className={styles.statCard}>
          <div className={styles.statIcon}><Building size={20} /></div>
          <div>
            <div className={styles.statTitle}>Total Accounts</div>
            <div className={styles.statValue}>{meta?.total || 0}</div>
          </div>
        </Card>
      </div>

      {/* Filter and Search controls */}
      <Card className={styles.filterCard}>
        <div className={styles.filters}>
          <SearchInput 
            value={search} 
            onChange={(val) => { setSearch(val); setPage(1); }} 
            placeholder="Search accounts by name..."
            className={styles.searchInput}
          />
          <div className={styles.selectWrapper}>
            <Select 
              options={[{ value: '', label: 'All Industries' }, ...INDUSTRY_OPTIONS]}
              value={industry}
              onChange={(val) => { setIndustry(val); setPage(1); }}
              placeholder="Filter by Industry"
            />
          </div>
        </div>
      </Card>

      {/* Accounts Table List */}
      <Card className={styles.tableCard}>
        <Table 
          columns={columns}
          data={accounts || []}
          loading={loading}
          onRowClick={(row) => navigate(`/accounts/${row.id}`)}
          onSort={handleSort}
          sortKey={sortKey}
          sortDirection={sortOrder}
          emptyMessage="No accounts found. Create a new one to get started!"
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

      {/* Create Account Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Account">
        <form onSubmit={handleCreateAccount} className={styles.form}>
          <div className={styles.formRow}>
            <Input 
              label="Company Name *" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              placeholder="e.g. Acme Corp" 
              required
            />
            <div className={styles.inputField}>
              <label className={styles.inputLabel}>Industry</label>
              <Select 
                options={INDUSTRY_OPTIONS}
                value={newIndustry}
                onChange={setNewIndustry}
                placeholder="Select Industry"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <Input 
              label="Website" 
              value={newWebsite} 
              onChange={(e) => setNewWebsite(e.target.value)} 
              placeholder="e.g. www.acme.com" 
            />
            <Input 
              label="Phone" 
              value={newPhone} 
              onChange={(e) => setNewPhone(e.target.value)} 
              placeholder="e.g. +1 555 123 4567" 
            />
          </div>

          <div className={styles.formRow}>
            <Input 
              label="Annual Revenue ($)" 
              type="number" 
              value={newRevenue} 
              onChange={(e) => setNewRevenue(e.target.value)} 
              placeholder="e.g. 5000000" 
            />
            <Input 
              label="Employees" 
              type="number" 
              value={newEmployees} 
              onChange={(e) => setNewEmployees(e.target.value)} 
              placeholder="e.g. 150" 
            />
          </div>

          <Input 
            label="Tags (Comma separated)" 
            value={newTagsString} 
            onChange={(e) => setNewTagsString(e.target.value)} 
            placeholder="e.g. Enterprise, Tech, Lead" 
          />

          <TextArea 
            label="Description" 
            value={newDescription} 
            onChange={(e) => setNewDescription(e.target.value)} 
            placeholder="Provide detail about this account..." 
          />

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

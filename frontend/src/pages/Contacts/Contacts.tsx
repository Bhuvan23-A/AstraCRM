import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '../../hooks/useCRM';
import { crmService } from '../../services/crm';
import { useToastStore } from '../../stores/toastStore';
import { Account, Contact } from '../../types/crm';
import { 
  Button, Input, Table, Modal, Card, 
  Badge, SearchInput, Pagination, Breadcrumbs, Select
} from '../../components/ui';
import { Users, Plus, Mail, Phone, Trash, Edit, Save } from 'lucide-react';
import { CrmLayout } from '../../components/layout/CrmLayout';
import styles from './Contacts.module.css';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'unsubscribed', label: 'Unsubscribed' }
];

export const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  
  // Page search/filter states
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Accounts cache for selector dropdowns
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Fetch contacts query
  const { data: contacts, loading, refetch, meta } = useContacts({
    page,
    per_page: 10,
    search,
    status,
    sort_by: sortKey,
    sort_order: sortOrder
  });

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeContactId, setActiveContactId] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [contactStatus, setContactStatus] = useState('active');
  const [accountId, setAccountId] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate checks status state
  const [dupWarnings, setDupWarnings] = useState<any[]>([]);

  // Fetch account options for select list
  const loadAccountOptions = async () => {
    try {
      const res = await crmService.getAccounts({ per_page: 100 });
      if (res.success && res.data) {
        setAccounts(res.data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadAccountOptions();
  }, []);

  // Run duplicate check on email/phone input blur
  const handleCheckDuplicates = async () => {
    if (!email && !phone) return;
    try {
      const res = await crmService.checkContactDuplicates(
        email || undefined, 
        phone || undefined, 
        activeContactId || undefined
      );
      if (res.success && res.data) {
        setDupWarnings(res.data);
      }
    } catch (err) {}
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit');
    setActiveContactId(contact.id);
    setFirstName(contact.first_name);
    setLastName(contact.last_name);
    setEmail(contact.email || '');
    setPhone(contact.phone || '');
    setJobTitle(contact.job_title || '');
    setContactStatus(contact.status);
    setAccountId(contact.account_id || '');
    setTagsString(contact.tags?.map(t => t.name).join(', ') || '');
    setDescription(contact.description || '');
    setDupWarnings([]);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setActiveContactId(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setJobTitle('');
    setContactStatus('active');
    setAccountId('');
    setTagsString('');
    setDescription('');
    setDupWarnings([]);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      addToast({ type: 'warning', title: 'Validation Warning', message: 'First name and Last name are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const tagNames = tagsString.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        phone: phone || undefined,
        job_title: jobTitle || undefined,
        status: contactStatus,
        account_id: accountId || undefined,
        tag_names: tagNames,
        description: description || undefined
      };

      let res;
      if (modalMode === 'create') {
        res = await crmService.createContact(payload);
      } else if (activeContactId) {
        res = await crmService.updateContact(activeContactId, payload);
      }

      if (res && res.success) {
        addToast({ 
          type: 'success', 
          title: modalMode === 'create' ? 'Contact Created' : 'Contact Updated', 
          message: `Contact "${firstName} ${lastName}" saved successfully.` 
        });
        setIsModalOpen(false);
        resetForm();
        refetch();
      }
    } catch (err) {} finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete contact "${name}"?`)) return;

    try {
      const res = await crmService.deleteContact(id);
      if (res.success) {
        addToast({ type: 'success', title: 'Contact Deleted', message: `Contact "${name}" has been deleted.` });
        refetch();
      }
    } catch (err) {}
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortOrder(direction);
  };

  // Convert account list into select options
  const accountOptions = [
    { value: '', label: 'Select Company' },
    ...accounts.map(a => ({ value: a.id, label: a.name }))
  ];

  // Table columns definition
  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (_: any, row: Contact) => (
        <span className={styles.fullName}>
          {row.first_name} {row.last_name}
        </span>
      )
    },
    {
      key: 'job_title',
      title: 'Title',
      sortable: true,
      render: (val: string) => val || <span className={styles.empty}>—</span>
    },
    {
      key: 'account_name',
      title: 'Company',
      render: (val: string, row: Contact) => row.account_id ? (
        <span 
          className={styles.accountLink} 
          onClick={(e) => { e.stopPropagation(); navigate(`/accounts/${row.account_id}`); }}
        >
          {val}
        </span>
      ) : <span className={styles.empty}>—</span>
    },
    {
      key: 'email',
      title: 'Email',
      render: (val: string) => val ? (
        <a href={`mailto:${val}`} className={styles.link} onClick={e => e.stopPropagation()}>
          <Mail size={12} style={{ marginRight: '6px' }} /> {val}
        </a>
      ) : <span className={styles.empty}>—</span>
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (val: string) => val ? (
        <span className={styles.text}><Phone size={12} style={{ marginRight: '6px' }} /> {val}</span>
      ) : <span className={styles.empty}>—</span>
    },
    {
      key: 'status',
      title: 'Status',
      render: (val: string) => {
        let badgeVariant: 'success' | 'warning' | 'danger' | 'default' = 'default';
        if (val === 'active') badgeVariant = 'success';
        if (val === 'inactive') badgeVariant = 'warning';
        if (val === 'bounce') badgeVariant = 'danger';
        return <Badge variant={badgeVariant}>{val}</Badge>;
      }
    },
    {
      key: 'actions',
      title: '',
      render: (_: any, row: Contact) => (
        <div className={styles.rowActions}>
          <Button variant="ghost" size="sm" onClick={(e) => handleOpenEdit(row, e)}>
            <Edit size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => handleDeleteContact(row.id, `${row.first_name} ${row.last_name}`, e)} className={styles.deleteBtn}>
            <Trash size={14} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <CrmLayout>
      <div className={styles.pageHeader}>
        <div>
          <Breadcrumbs items={[{ label: 'Home' }, { label: 'Contacts' }]} />
          <h1 className={styles.title}>Contacts Directory</h1>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleOpenCreate}>
          New Contact
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className={styles.statsGrid}>
        <Card variant="stat" className={styles.statCard}>
          <div className={styles.statIcon}><Users size={20} /></div>
          <div>
            <div className={styles.statTitle}>Total Contacts</div>
            <div className={styles.statValue}>{meta?.total || 0}</div>
          </div>
        </Card>
      </div>

      {/* Filters card */}
      <Card className={styles.filterCard}>
        <div className={styles.filters}>
          <SearchInput 
            value={search} 
            onChange={(val) => { setSearch(val); setPage(1); }} 
            placeholder="Search contacts by name or email..."
            className={styles.searchInput}
          />
          <div className={styles.selectWrapper}>
            <Select 
              options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTIONS]}
              value={status}
              onChange={(val) => { setStatus(val); setPage(1); }}
              placeholder="Filter by Status"
            />
          </div>
        </div>
      </Card>

      {/* Contacts List Card Table */}
      <Card className={styles.tableCard}>
        <Table 
          columns={columns}
          data={contacts || []}
          loading={loading}
          onSort={handleSort}
          sortKey={sortKey}
          sortDirection={sortOrder}
          emptyMessage="No contacts found. Create a new one to get started!"
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

      {/* Create / Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalMode === 'create' ? "Create New Contact" : "Edit Contact"}
      >
        <form onSubmit={handleSaveContact} className={styles.form}>
          
          {dupWarnings.length > 0 && (
            <div className={styles.warningAlert}>
              <h4 className={styles.warningTitle}>Potential Duplicate Alert:</h4>
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
              placeholder="e.g. Sarah" 
              required
            />
            <Input 
              label="Last Name *" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              placeholder="e.g. Jenkins" 
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
              placeholder="e.g. sarah.j@company.com" 
            />
            <Input 
              label="Phone Number" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              onBlur={handleCheckDuplicates}
              placeholder="e.g. +1 555 987 6543" 
            />
          </div>

          <div className={styles.formRow}>
            <Input 
              label="Job Title" 
              value={jobTitle} 
              onChange={(e) => setJobTitle(e.target.value)} 
              placeholder="e.g. Project Manager" 
            />
            <div className={styles.inputField}>
              <label className={styles.inputLabel}>Company (Account)</label>
              <Select 
                options={accountOptions}
                value={accountId}
                onChange={setAccountId}
                placeholder="Select Account"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputField}>
              <label className={styles.inputLabel}>Status</label>
              <Select 
                options={STATUS_OPTIONS}
                value={contactStatus}
                onChange={setContactStatus}
              />
            </div>
            <Input 
              label="Tags (Comma separated)" 
              value={tagsString} 
              onChange={(e) => setTagsString(e.target.value)} 
              placeholder="e.g. Partner, Support, Influencer" 
            />
          </div>

          <TextArea 
            label="Internal Notes" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add comments or relationship notes..." 
          />

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Create Contact' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </CrmLayout>
  );
};

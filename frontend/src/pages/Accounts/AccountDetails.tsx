import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { crmService } from '../../services/crm';
import { useToastStore } from '../../stores/toastStore';
import { Account, Contact } from '../../types/crm';
import { 
  Button, Card, Badge, Breadcrumbs, Table, 
  Modal, Input, TextArea, Select 
} from '../../components/ui';
import { Building, Globe, Phone, Mail, UserPlus, ArrowLeft, Edit, Save, Trash } from 'lucide-react';
import styles from './AccountDetails.module.css';

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

export const AccountDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRevenue, setEditRevenue] = useState('');
  const [editEmployees, setEditEmployees] = useState('');
  const [editAddress1, setEditAddress1] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTagsString, setEditTagsString] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Add contact modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [cFirstName, setCFirstName] = useState('');
  const [cLastName, setCLastName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cJobTitle, setCJobTitle] = useState('');
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);

  const fetchAccountData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await crmService.getAccount(id);
      if (res.success && res.data) {
        setAccount(res.data);
        populateEditForm(res.data);
      }
    } catch (err) {
      navigate('/accounts');
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (data: Account) => {
    setEditName(data.name);
    setEditIndustry(data.industry || '');
    setEditWebsite(data.website || '');
    setEditPhone(data.phone || '');
    setEditRevenue(data.annual_revenue?.toString() || '');
    setEditEmployees(data.employees_count?.toString() || '');
    setEditAddress1(data.address_line1 || '');
    setEditCity(data.city || '');
    setEditState(data.state || '');
    setEditCountry(data.country || '');
    setEditDescription(data.description || '');
    setEditTagsString(data.tags?.map(t => t.name).join(', ') || '');
  };

  useEffect(() => {
    fetchAccountData();
  }, [id]);

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editName.trim()) return;

    setIsSaving(true);
    try {
      const tagNames = editTagsString.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const res = await crmService.updateAccount(id, {
        name: editName,
        industry: editIndustry || undefined,
        website: editWebsite || undefined,
        phone: editPhone || undefined,
        annual_revenue: editRevenue ? parseFloat(editRevenue) : undefined,
        employees_count: editEmployees ? parseInt(editEmployees) : undefined,
        address_line1: editAddress1 || undefined,
        city: editCity || undefined,
        state: editState || undefined,
        country: editCountry || undefined,
        description: editDescription || undefined,
        tag_names: tagNames
      });

      if (res.success && res.data) {
        addToast({ type: 'success', title: 'Account Updated', message: 'The account was updated successfully.' });
        setAccount(res.data);
        setIsEditMode(false);
      }
    } catch (err) {} finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!id || !account) return;
    if (!window.confirm(`Are you sure you want to delete account "${account.name}"?`)) return;

    try {
      const res = await crmService.deleteAccount(id);
      if (res.success) {
        addToast({ type: 'success', title: 'Account Deleted', message: `Account "${account.name}" has been deleted.` });
        navigate('/accounts');
      }
    } catch (err) {}
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !cFirstName.trim() || !cLastName.trim()) {
      addToast({ type: 'warning', title: 'Validation Warning', message: 'First and Last name are required.' });
      return;
    }

    setIsContactSubmitting(true);
    try {
      const res = await crmService.createContact({
        first_name: cFirstName,
        last_name: cLastName,
        email: cEmail || undefined,
        phone: cPhone || undefined,
        job_title: cJobTitle || undefined,
        account_id: id,
        status: 'active'
      });

      if (res.success) {
        addToast({ type: 'success', title: 'Contact Created', message: `Contact "${cFirstName} ${cLastName}" added to this account.` });
        setIsContactModalOpen(false);
        setCFirstName('');
        setCLastName('');
        setCEmail('');
        setCPhone('');
        setCJobTitle('');
        fetchAccountData(); // Refresh related contacts table
      }
    } catch (err) {} finally {
      setIsContactSubmitting(false);
    }
  };

  // Contacts Table Columns config
  const contactColumns = [
    {
      key: 'name',
      title: 'Name',
      render: (_: any, row: Contact) => (
        <span className={styles.contactName} onClick={() => navigate(`/contacts`)}>
          {row.first_name} {row.last_name}
        </span>
      )
    },
    {
      key: 'job_title',
      title: 'Job Title',
      render: (val: string) => val || <span className={styles.empty}>—</span>
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
      render: (val: string) => (
        <Badge variant={val === 'active' ? 'success' : 'warning'}>{val}</Badge>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading account profile details...
      </div>
    );
  }

  if (!account) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-danger)' }}>
        Account profile not found.
      </div>
    );
  }

  return (
    <>
      <div className={styles.backHeader}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/accounts')}>
          Back to Directory
        </Button>
      </div>

      <div className={styles.pageHeader}>
        <div>
          <Breadcrumbs items={[{ label: 'Home' }, { label: 'Accounts', href: '/accounts' }, { label: account.name }]} />
          <h1 className={styles.title}>{account.name}</h1>
        </div>
        <div className={styles.actionButtons}>
          <Button 
            variant={isEditMode ? 'secondary' : 'outline'} 
            leftIcon={<Edit size={16} />} 
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Cancel Edit' : 'Edit Company'}
          </Button>
          <Button variant="danger" leftIcon={<Trash size={16} />} onClick={handleDeleteAccount}>
            Delete
          </Button>
        </div>
      </div>

      {isEditMode ? (
        /* EDIT PROFILE VIEW */
        <Card className={styles.mainCard}>
          <form onSubmit={handleUpdateAccount} className={styles.form}>
            <h2 className={styles.sectionHeader}>Edit Company Profile</h2>
            <div className={styles.formRow}>
              <Input 
                label="Company Name *" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                required
              />
              <div className={styles.inputField}>
                <label className={styles.inputLabel}>Industry</label>
                <Select 
                  options={INDUSTRY_OPTIONS}
                  value={editIndustry}
                  onChange={setEditIndustry}
                  placeholder="Select Industry"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <Input 
                label="Website" 
                value={editWebsite} 
                onChange={(e) => setEditWebsite(e.target.value)} 
              />
              <Input 
                label="Phone" 
                value={editPhone} 
                onChange={(e) => setEditPhone(e.target.value)} 
              />
            </div>

            <div className={styles.formRow}>
              <Input 
                label="Annual Revenue ($)" 
                type="number" 
                value={editRevenue} 
                onChange={(e) => setEditRevenue(e.target.value)} 
              />
              <Input 
                label="Employees" 
                type="number" 
                value={editEmployees} 
                onChange={(e) => setEditEmployees(e.target.value)} 
              />
            </div>

            <div className={styles.formRow}>
              <Input 
                label="Address Line 1" 
                value={editAddress1} 
                onChange={(e) => setEditAddress1(e.target.value)} 
              />
              <Input 
                label="City" 
                value={editCity} 
                onChange={(e) => setEditCity(e.target.value)} 
              />
            </div>

            <div className={styles.formRow}>
              <Input 
                label="State / Province" 
                value={editState} 
                onChange={(e) => setEditState(e.target.value)} 
              />
              <Input 
                label="Country" 
                value={editCountry} 
                onChange={(e) => setEditCountry(e.target.value)} 
              />
            </div>

            <Input 
              label="Tags (comma separated)" 
              value={editTagsString} 
              onChange={(e) => setEditTagsString(e.target.value)} 
              placeholder="e.g. Enterprise, Tech, Inbound"
            />

            <TextArea 
              label="Description / Bio" 
              value={editDescription} 
              onChange={(e) => setEditDescription(e.target.value)} 
            />

            <div className={styles.formActions}>
              <Button variant="secondary" type="button" onClick={() => setIsEditMode(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSaving} leftIcon={<Save size={16} />}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* DETAIL STATIC PROFILE VIEW */
        <div className={styles.profileGrid}>
          {/* Main Info Card */}
          <div className={styles.leftColumn}>
            <Card className={styles.infoCard}>
              <h2 className={styles.cardTitle}>Company Profile</h2>
              
              <div className={styles.metaList}>
                <div className={styles.metaItem}>
                  <Building size={16} className={styles.metaIcon} />
                  <div>
                    <div className={styles.metaLabel}>Industry</div>
                    <div className={styles.metaValue}>{account.industry ? <Badge variant="info">{account.industry}</Badge> : '—'}</div>
                  </div>
                </div>

                <div className={styles.metaItem}>
                  <Globe size={16} className={styles.metaIcon} />
                  <div>
                    <div className={styles.metaLabel}>Website</div>
                    <div className={styles.metaValue}>
                      {account.website ? (
                        <a href={account.website.startsWith('http') ? account.website : `https://${account.website}`} target="_blank" rel="noreferrer" className={styles.profileLink}>
                          {account.website}
                        </a>
                      ) : '—'}
                    </div>
                  </div>
                </div>

                <div className={styles.metaItem}>
                  <Phone size={16} className={styles.metaIcon} />
                  <div>
                    <div className={styles.metaLabel}>Phone</div>
                    <div className={styles.metaValue}>{account.phone || '—'}</div>
                  </div>
                </div>

                {account.annual_revenue !== null && (
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Annual Revenue</div>
                    <div className={styles.metaValue}>${account.annual_revenue.toLocaleString()}</div>
                  </div>
                )}

                {account.employees_count !== null && (
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Employees count</div>
                    <div className={styles.metaValue}>{account.employees_count} employees</div>
                  </div>
                )}

                {(account.city || account.country) && (
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Location</div>
                    <div className={styles.metaValue}>
                      {[account.address_line1, account.city, account.state, account.country]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                )}
              </div>

              {account.tags && account.tags.length > 0 && (
                <div className={styles.tagsSection}>
                  <div className={styles.metaLabel}>Tags</div>
                  <div className={styles.tagsContainer}>
                    {account.tags.map(t => (
                      <span key={t.id} className={styles.tag} style={{ backgroundColor: t.color }}>{t.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {account.description && (
                <div className={styles.descriptionSection}>
                  <div className={styles.metaLabel}>About Company</div>
                  <p className={styles.descriptionText}>{account.description}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Related Contacts List Column */}
          <div className={styles.rightColumn}>
            <div className={styles.tableHeader}>
              <h2 className={styles.subCardTitle}>Key Contacts ({account.contacts?.length || 0})</h2>
              <Button variant="outline" size="sm" leftIcon={<UserPlus size={14} />} onClick={() => setIsContactModalOpen(true)}>
                Add Contact
              </Button>
            </div>
            
            <Card className={styles.tableCard}>
              <Table 
                columns={contactColumns}
                data={account.contacts || []}
                emptyMessage="No contacts linked to this company yet. Click 'Add Contact' to attach one."
              />
            </Card>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      <Modal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} title={`Add Contact to ${account.name}`}>
        <form onSubmit={handleAddContact} className={styles.form}>
          <div className={styles.formRow}>
            <Input 
              label="First Name *" 
              value={cFirstName} 
              onChange={(e) => setCFirstName(e.target.value)} 
              placeholder="e.g. John"
              required
            />
            <Input 
              label="Last Name *" 
              value={cLastName} 
              onChange={(e) => setCLastName(e.target.value)} 
              placeholder="e.g. Doe"
              required
            />
          </div>

          <Input 
            label="Email" 
            type="email"
            value={cEmail} 
            onChange={(e) => setCEmail(e.target.value)} 
            placeholder="e.g. john.doe@email.com"
          />

          <div className={styles.formRow}>
            <Input 
              label="Phone" 
              value={cPhone} 
              onChange={(e) => setCPhone(e.target.value)} 
              placeholder="e.g. +1 555 1234"
            />
            <Input 
              label="Job Title" 
              value={cJobTitle} 
              onChange={(e) => setCJobTitle(e.target.value)} 
              placeholder="e.g. VP of Sales"
            />
          </div>

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={() => setIsContactModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isContactSubmitting}>
              Add Contact
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

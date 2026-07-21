import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { crmService } from '../../services/crm';
import { useToastStore } from '../../stores/toastStore';
import { Lead, Account } from '../../types/crm';
import { 
  Button, Card, Badge, Breadcrumbs, Table, 
  Modal, Input, TextArea, Select, Checkbox
} from '../../components/ui';
import { 
  Target, Globe, Phone, Mail, Sparkles, Flame,
  ArrowLeft, Edit, Save, Trash, Shuffle, CheckCircle, ExternalLink
} from 'lucide-react';
import styles from './LeadDetails.module.css';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'lost', label: 'Lost' }
];

const SOURCE_OPTIONS = [
  { value: 'Website', label: 'Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Email Campaign', label: 'Email Campaign' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Manual', label: 'Manual Entry' },
  { value: 'Other', label: 'Other' }
];

export const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTagsString, setEditTagsString] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Conversion Modal states
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [createAccount, setCreateAccount] = useState(true);
  const [createContact, setCreateContact] = useState(true);
  const [existingAccountId, setExistingAccountId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const fetchLeadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await crmService.getLead(id);
      if (res.success && res.data) {
        setLead(res.data);
        populateEditForm(res.data);
      }
    } catch (err) {
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (data: Lead) => {
    setEditFirstName(data.first_name);
    setEditLastName(data.last_name);
    setEditEmail(data.email || '');
    setEditPhone(data.phone || '');
    setEditCompanyName(data.company_name || '');
    setEditSource(data.source || '');
    setEditStatus(data.status);
    setEditDescription(data.description || '');
    setEditTagsString(data.tags?.map(t => t.name).join(', ') || '');
  };

  const loadAccountOptions = async () => {
    try {
      const res = await crmService.getAccounts({ per_page: 100 });
      if (res.success && res.data) {
        setAccounts(res.data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchLeadData();
    loadAccountOptions();
  }, [id]);

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editFirstName.trim() || !editLastName.trim()) return;

    setIsSaving(true);
    try {
      const tagNames = editTagsString.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const res = await crmService.updateLead(id, {
        first_name: editFirstName,
        last_name: editLastName,
        email: editEmail || undefined,
        phone: editPhone || undefined,
        company_name: editCompanyName || undefined,
        source: editSource || undefined,
        status: editStatus,
        description: editDescription || undefined,
        tag_names: tagNames
      });

      if (res.success && res.data) {
        addToast({ type: 'success', title: 'Lead Updated', message: 'Lead information was updated successfully.' });
        setLead(res.data);
        setIsEditMode(false);
      }
    } catch (err) {} finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!id || !lead) return;
    if (!window.confirm(`Are you sure you want to delete lead "${lead.first_name} ${lead.last_name}"?`)) return;

    try {
      const res = await crmService.deleteLead(id);
      if (res.success) {
        addToast({ type: 'success', title: 'Lead Deleted', message: `Lead has been deleted.` });
        navigate('/leads');
      }
    } catch (err) {}
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsConverting(true);
    try {
      const res = await crmService.convertLead(id, {
        create_account: createAccount,
        create_contact: createContact,
        existing_account_id: existingAccountId || undefined
      });

      if (res.success && res.data) {
        addToast({ 
          type: 'success', 
          title: 'Lead Converted', 
          message: 'Lead converted into Customer Account/Contact successfully.' 
        });
        setIsConvertOpen(false);
        setLead(res.data); // Refresh view with conversion statuses
      }
    } catch (err) {} finally {
      setIsConverting(false);
    }
  };

  const renderScoreBadge = (score: number) => {
    if (score >= 35) {
      return (
        <span className={`${styles.scoreBadge} ${styles.hotScore}`}>
          <Flame size={12} style={{ marginRight: '4px' }} /> {score} (Hot)
        </span>
      );
    } else if (score >= 15) {
      return (
        <span className={`${styles.scoreBadge} ${styles.warmScore}`}>
          <Sparkles size={12} style={{ marginRight: '4px' }} /> {score} (Warm)
        </span>
      );
    } else {
      return (
        <span className={`${styles.scoreBadge} ${styles.coldScore}`}>
          {score} (Cold)
        </span>
      );
    }
  };

  const accountOptions = [
    { value: '', label: 'Create New Account' },
    ...accounts.map(a => ({ value: a.id, label: a.name }))
  ];

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading lead record details...
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-danger)' }}>
        Lead record not found.
      </div>
    );
  }

  return (
    <>
      <div className={styles.backHeader}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/leads')}>
          Back to Database
        </Button>
      </div>

      <div className={styles.pageHeader}>
        <div>
          <Breadcrumbs items={[{ label: 'Home' }, { label: 'Leads', href: '/leads' }, { label: `${lead.first_name} ${lead.last_name}` }]} />
          <h1 className={styles.title}>{lead.first_name} {lead.last_name}</h1>
        </div>
        
        {lead.status !== 'converted' && (
          <div className={styles.actionButtons}>
            <Button 
              variant="outline"
              leftIcon={<Shuffle size={16} />} 
              onClick={() => setIsConvertOpen(true)}
              className={styles.convertBtn}
            >
              Convert to Customer
            </Button>
            <Button 
              variant={isEditMode ? 'secondary' : 'outline'} 
              leftIcon={<Edit size={16} />} 
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'Cancel Edit' : 'Edit Lead'}
            </Button>
            <Button variant="danger" leftIcon={<Trash size={16} />} onClick={handleDeleteLead}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {lead.status === 'converted' && (
        <div className={styles.convertedAlert}>
          <CheckCircle size={20} className={styles.alertIcon} />
          <div>
            <h4 className={styles.alertTitle}>Lead Converted Successfully!</h4>
            <p className={styles.alertText}>
              This lead was converted into a Customer Account and Contact profile.
            </p>
            <div className={styles.conversionLinks}>
              {lead.converted_account_id && (
                <Link to={`/accounts/${lead.converted_account_id}`} className={styles.alertLink}>
                  View Account Profile <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                </Link>
              )}
              {lead.converted_contact_id && (
                <Link to={`/contacts`} className={styles.alertLink}>
                  View Contact Directory <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditMode ? (
        /* EDIT PROFILE VIEW */
        <Card className={styles.mainCard}>
          <form onSubmit={handleUpdateLead} className={styles.form}>
            <h2 className={styles.sectionHeader}>Edit Lead Details</h2>
            <div className={styles.formRow}>
              <Input 
                label="First Name *" 
                value={editFirstName} 
                onChange={(e) => setEditFirstName(e.target.value)} 
                required
              />
              <Input 
                label="Last Name *" 
                value={editLastName} 
                onChange={(e) => setEditLastName(e.target.value)} 
                required
              />
            </div>

            <div className={styles.formRow}>
              <Input 
                label="Email Address" 
                type="email"
                value={editEmail} 
                onChange={(e) => setEditEmail(e.target.value)} 
              />
              <Input 
                label="Phone Number" 
                value={editPhone} 
                onChange={(e) => setEditPhone(e.target.value)} 
              />
            </div>

            <div className={styles.formRow}>
              <Input 
                label="Company / Organization" 
                value={editCompanyName} 
                onChange={(e) => setEditCompanyName(e.target.value)} 
              />
              <div className={styles.inputField}>
                <label className={styles.inputLabel}>Lead Source</label>
                <Select 
                  options={SOURCE_OPTIONS}
                  value={editSource}
                  onChange={setEditSource}
                  placeholder="Select Source"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputField}>
                <label className={styles.inputLabel}>Lead Status</label>
                <Select 
                  options={STATUS_OPTIONS}
                  value={editStatus}
                  onChange={setEditStatus}
                />
              </div>
              <Input 
                label="Tags (comma separated)" 
                value={editTagsString} 
                onChange={(e) => setEditTagsString(e.target.value)} 
                placeholder="e.g. Retail, Inbound, Warm"
              />
            </div>

            <TextArea 
              label="Description / Context" 
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
        /* DETAIL STATIC RECORD VIEW */
        <div className={styles.profileGrid}>
          {/* Main info card */}
          <div className={styles.leftColumn}>
            <Card className={styles.infoCard}>
              <h2 className={styles.cardTitle}>Lead Information</h2>
              
              <div className={styles.metaList}>
                <div className={styles.metaItem}>
                  <div>
                    <div className={styles.metaLabel}>Status</div>
                    <div className={styles.metaValue}>
                      <Badge variant={lead.status === 'new' ? 'primary' : lead.status === 'qualified' ? 'success' : 'warning'}>
                        {lead.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className={styles.metaItem}>
                  <div>
                    <div className={styles.metaLabel}>Lead Score</div>
                    <div className={styles.metaValue}>{renderScoreBadge(lead.score)}</div>
                  </div>
                </div>

                <div className={styles.metaItem}>
                  <Mail size={16} className={styles.metaIcon} />
                  <div>
                    <div className={styles.metaLabel}>Email</div>
                    <div className={styles.metaValue}>
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} className={styles.profileLink}>
                          {lead.email}
                        </a>
                      ) : '—'}
                    </div>
                  </div>
                </div>

                <div className={styles.metaItem}>
                  <Phone size={16} className={styles.metaIcon} />
                  <div>
                    <div className={styles.metaLabel}>Phone</div>
                    <div className={styles.metaValue}>{lead.phone || '—'}</div>
                  </div>
                </div>

                <div className={styles.metaItem}>
                  <Globe size={16} className={styles.metaIcon} />
                  <div>
                    <div className={styles.metaLabel}>Company</div>
                    <div className={styles.metaValue}>{lead.company_name || '—'}</div>
                  </div>
                </div>

                <div className={styles.metaItem}>
                  <div>
                    <div className={styles.metaLabel}>Lead Source</div>
                    <div className={styles.metaValue}>{lead.source ? <Badge variant="default">{lead.source}</Badge> : '—'}</div>
                  </div>
                </div>
              </div>

              {lead.tags && lead.tags.length > 0 && (
                <div className={styles.tagsSection}>
                  <div className={styles.metaLabel}>Tags</div>
                  <div className={styles.tagsContainer}>
                    {lead.tags.map(t => (
                      <span key={t.id} className={styles.tag} style={{ backgroundColor: t.color }}>{t.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {lead.description && (
                <div className={styles.descriptionSection}>
                  <div className={styles.metaLabel}>Capture context</div>
                  <p className={styles.descriptionText}>{lead.description}</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      <Modal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} title={`Convert ${lead.first_name} to Customer`}>
        <form onSubmit={handleConvertLead} className={styles.form}>
          <p className={styles.modalIntro}>
            This action converts the lead into active entities in your CRM. Choose how you want to map the lead.
          </p>

          <div className={styles.checkboxGroup}>
            <Checkbox 
              label="Create contact profile for this individual?" 
              checked={createContact}
              onChange={setCreateContact}
            />
            
            {lead.company_name && (
              <Checkbox 
                label={`Create company Account for "${lead.company_name}"?`} 
                checked={createAccount && !existingAccountId}
                disabled={!!existingAccountId}
                onChange={setCreateAccount}
              />
            )}
          </div>

          {lead.company_name && (
            <div className={styles.inputField}>
              <label className={styles.inputLabel}>Or link to an Existing Company Account</label>
              <Select 
                options={accountOptions}
                value={existingAccountId}
                onChange={(val) => {
                  setExistingAccountId(val);
                  if (val) setCreateAccount(false);
                }}
              />
            </div>
          )}

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={() => setIsConvertOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isConverting} leftIcon={<Shuffle size={16} />}>
              Perform Conversion
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

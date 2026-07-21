import React, { useState } from 'react';
import { 
  Button, Input, TextArea, Select, Checkbox, Toggle, 
  Badge, Avatar, Card, StatCard, Tooltip, ProgressBar, 
  FileUpload, DatePicker, DateRangePicker, Timeline, 
  KanbanColumn, MultiSelect, Modal, Table, Dropdown, 
  Tabs, Skeleton, EmptyState, Breadcrumbs, Pagination, 
  SearchInput 
} from '../../components/ui';
import { useToastStore } from '../../stores/toastStore';
import { useThemeStore } from '../../stores/themeStore';
import { Plus, Download, ArrowRight, Inbox, Sun, Moon, Edit, Copy, Trash } from 'lucide-react';
import styles from './ComponentShowcase.module.css';

export const ComponentShowcase: React.FC = () => {
  const { addToast } = useToastStore();
  const { theme, toggleTheme } = useThemeStore();

  // State for Form Inputs
  const [inputValue, setInputValue] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const [isToggled, setIsToggled] = useState(false);
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [dateRangeValue, setDateRangeValue] = useState<{start: Date | null, end: Date | null}>({start: null, end: null});
  const [files, setFiles] = useState<File[]>([]);

  // State for Navigation & Overlays
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const selectOptions = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' }
  ];

  const tableData = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'Inactive' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'Active' },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'Admin', status: 'Pending' },
    { id: '5', name: 'Charlie Davis', email: 'charlie@example.com', role: 'Editor', status: 'Active' },
  ];

  const tableColumns = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'role', title: 'Role', sortable: true },
    { 
      key: 'status', 
      title: 'Status', 
      render: (val: any) => (
        <Badge variant={val === 'Active' ? 'success' : val === 'Inactive' ? 'danger' : 'warning'}>
          {val}
        </Badge>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: () => <Button size="sm" variant="ghost">Edit</Button>
    }
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sanna CRM — Component Showcase</h1>
        <Button 
          variant="ghost" 
          icon={theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />} 
          onClick={toggleTheme}
        >
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </header>

      <div className={styles.contentWrapper}>
        <aside className={styles.sidebar}>
          <ul className={styles.sidebarList}>
            <li><a href="#buttons" onClick={(e) => { e.preventDefault(); scrollToSection('buttons'); }} className={styles.sidebarItem}>Buttons</a></li>
            <li><a href="#form-inputs" onClick={(e) => { e.preventDefault(); scrollToSection('form-inputs'); }} className={styles.sidebarItem}>Form Inputs</a></li>
            <li><a href="#data-display" onClick={(e) => { e.preventDefault(); scrollToSection('data-display'); }} className={styles.sidebarItem}>Data Display</a></li>
            <li><a href="#navigation" onClick={(e) => { e.preventDefault(); scrollToSection('navigation'); }} className={styles.sidebarItem}>Navigation & Layout</a></li>
            <li><a href="#overlays" onClick={(e) => { e.preventDefault(); scrollToSection('overlays'); }} className={styles.sidebarItem}>Overlays & Feedback</a></li>
          </ul>
        </aside>

        <main className={styles.mainContent}>
          
          {/* SECTION 1: Buttons */}
          <section id="buttons" className={styles.section}>
            <h2 className={styles.sectionTitle}>Buttons</h2>
            
            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Variants</div>
              <div className={styles.componentRow}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Sizes</div>
              <div className={styles.componentRow}>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>States & Icons</div>
              <div className={styles.componentRow}>
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button leftIcon={<Plus size={16} />}>Left Icon</Button>
                <Button rightIcon={<ArrowRight size={16} />}>Right Icon</Button>
                <Button icon={<Download size={16} />} aria-label="Download" />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Full Width</div>
              <Button fullWidth>Full Width Button</Button>
            </div>
          </section>

          {/* SECTION 2: Form Inputs */}
          <section id="form-inputs" className={styles.section}>
            <h2 className={styles.sectionTitle}>Form Inputs</h2>
            
            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Text Inputs</div>
              <div className={styles.componentColumn}>
                <Input placeholder="Default Input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                <Input label="With Label" placeholder="Enter text..." />
                <Input label="With Helper Text" helperText="This is a helper text" />
                <Input label="With Error" error="This field is required" />
                <Input label="Disabled" disabled value="Cannot edit me" />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Text Area</div>
              <div className={styles.componentColumn}>
                <TextArea placeholder="Default TextArea" value={textAreaValue} onChange={(e) => setTextAreaValue(e.target.value)} />
                <TextArea label="With Character Count" maxLength={200} showCount />
                <TextArea label="With Error" error="Too short" />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Selects</div>
              <div className={styles.componentColumn} style={{ maxWidth: '400px' }}>
                <Select label="Default Select" options={selectOptions} value={selectValue} onChange={setSelectValue} />
                <Select label="Searchable Select" options={selectOptions} searchable value={selectValue} onChange={setSelectValue} />
                <MultiSelect label="MultiSelect" options={selectOptions} value={multiSelectValues} onChange={setMultiSelectValues} />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Search Input</div>
              <div className={styles.componentRow}>
                <SearchInput value={searchValue} onChange={setSearchValue} placeholder="Search..." />
                <SearchInput loading placeholder="Loading search..." />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Toggles & Checkboxes</div>
              <div className={styles.componentRow}>
                <Checkbox checked={isChecked} onChange={(e) => setIsChecked(e.target.checked)} label="Checkbox" />
                <Checkbox checked={false} indeterminate={isIndeterminate} onChange={() => setIsIndeterminate(!isIndeterminate)} label="Indeterminate" />
                <Checkbox disabled label="Disabled Checkbox" />
                <div style={{ width: '20px' }}></div>
                <Toggle checked={isToggled} onChange={setIsToggled} label="Toggle" />
                <Toggle checked={false} disabled label="Disabled Toggle" />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Date Pickers & File Upload</div>
              <div className={styles.componentColumn} style={{ maxWidth: '400px' }}>
                <DatePicker label="Date Picker" value={dateValue} onChange={setDateValue} />
                <DateRangePicker label="Date Range Picker" value={dateRangeValue} onChange={setDateRangeValue} />
                <FileUpload label="File Upload" helperText="Upload an image or document" value={files} onChange={setFiles} />
              </div>
            </div>
          </section>

          {/* SECTION 3: Data Display */}
          <section id="data-display" className={styles.section}>
            <h2 className={styles.sectionTitle}>Data Display</h2>
            
            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Badges</div>
              <div className={styles.componentRow}>
                <Badge>Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
                <Badge dot variant="success">Active</Badge>
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Avatars</div>
              <div className={styles.componentRow}>
                <Avatar src="https://i.pravatar.cc/150?img=1" size="sm" />
                <Avatar name="John Doe" size="md" />
                <Avatar src="https://i.pravatar.cc/150?img=3" size="lg" status="online" />
                <Avatar name="Alice Smith" size="lg" status="busy" />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Cards</div>
              <div className={styles.componentRow}>
                <Card>Standard Card with content</Card>
                <Card variant="glass">Glass Card</Card>
                <Card hoverable>Hoverable Card</Card>
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Stat Cards</div>
              <div className={styles.componentRow}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <StatCard title="Total Revenue" value="$48,250" change={12.5} />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <StatCard title="Active Leads" value="342" change={-3.2} />
                </div>
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Progress Bars</div>
              <div className={styles.componentColumn}>
                <ProgressBar value={45} animated />
                <ProgressBar value={70} variant="success" label="Loading..." />
                <ProgressBar value={90} variant="danger" size="sm" />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Tooltips</div>
              <div className={styles.componentRow}>
                <Tooltip content="Top tooltip" position="top"><Button>Hover me (Top)</Button></Tooltip>
                <Tooltip content="Bottom tooltip" position="bottom"><Button>Hover me (Bottom)</Button></Tooltip>
                <Tooltip content="Left tooltip" position="left"><Button>Hover me (Left)</Button></Tooltip>
                <Tooltip content="Right tooltip" position="right"><Button>Hover me (Right)</Button></Tooltip>
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Skeletons</div>
              <div className={styles.componentColumn}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <div style={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </div>
                </div>
                <Skeleton variant="rectangular" height={100} />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Empty State</div>
              <div className={styles.sampleContainer}>
                <EmptyState 
                  icon={<Inbox size={48} />} 
                  title="No data found" 
                  description="There are no items to display at this time."
                  action={{ label: 'Create New', onClick: () => {} }}
                />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Timeline</div>
              <div className={styles.sampleContainer}>
                <Timeline items={[
                  { id: '1', title: 'Created account', date: '2 hours ago', status: 'completed' },
                  { id: '2', title: 'Verified email', date: '1 hour ago', status: 'completed' },
                  { id: '3', title: 'Completed profile', date: '30 mins ago', status: 'current' },
                  { id: '4', title: 'Start using app', status: 'upcoming' }
                ]} />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Table</div>
              <Table 
                columns={tableColumns} 
                data={tableData} 
                selectable 
                selectedKeys={selectedRows}
                onSelectionChange={setSelectedRows}
              />
            </div>
          </section>

          {/* SECTION 4: Navigation & Layout */}
          <section id="navigation" className={styles.section}>
            <h2 className={styles.sectionTitle}>Navigation & Layout</h2>
            
            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Breadcrumbs</div>
              <Breadcrumbs items={[
                { label: 'Home', href: '#' },
                { label: 'Contacts', href: '#' },
                { label: 'John Doe' }
              ]} />
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Tabs</div>
              <div className={styles.componentColumn}>
                <Tabs 
                  activeId={activeTab} 
                  onChange={setActiveTab}
                  items={[
                    { id: 'tab1', label: 'Overview', content: <div className={styles.sampleContainer}>Overview Content</div> },
                    { id: 'tab2', label: 'Settings', content: <div className={styles.sampleContainer}>Settings Content</div> },
                    { id: 'tab3', label: 'Logs', content: <div className={styles.sampleContainer}>Logs Content</div> }
                  ]}
                />
              </div>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Pagination</div>
              <Pagination currentPage={currentPage} totalPages={15} onPageChange={setCurrentPage} />
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Kanban Column</div>
              <div style={{ maxWidth: '300px' }}>
                <KanbanColumn id="col1" title="In Progress" count={3}>
                  <Card hoverable className="mb-2">Task 1: Update designs</Card>
                  <Card hoverable className="mb-2">Task 2: Fix bug in prod</Card>
                  <Card hoverable>Task 3: Write tests</Card>
                </KanbanColumn>
              </div>
            </div>
          </section>

          {/* SECTION 5: Overlays & Feedback */}
          <section id="overlays" className={styles.section}>
            <h2 className={styles.sectionTitle}>Overlays & Feedback</h2>
            
            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Modals</div>
              <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
              <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                title="Example Modal"
                footer={
                  <>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => setIsModalOpen(false)}>Confirm</Button>
                  </>
                }
              >
                <p>This is a sample modal content. You can put anything here.</p>
              </Modal>
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Dropdown</div>
              <Dropdown 
                trigger={<Button>Actions</Button>}
                items={[
                  { id: '1', label: 'Edit', icon: <Edit size={16} /> },
                  { id: '2', label: 'Duplicate', icon: <Copy size={16} /> },
                  { id: 'divider', isDivider: true },
                  { id: '3', label: 'Delete', danger: true, icon: <Trash size={16} /> }
                ]}
              />
            </div>

            <div className={styles.componentGroup}>
              <div className={styles.componentGroupTitle}>Toasts</div>
              <div className={styles.componentRow}>
                <Button onClick={() => addToast({ title: 'Success', message: 'Action completed!', type: 'success' })} variant="outline">Success Toast</Button>
                <Button onClick={() => addToast({ title: 'Error', message: 'Something went wrong.', type: 'error' })} variant="outline">Error Toast</Button>
                <Button onClick={() => addToast({ title: 'Warning', message: 'Please check your inputs.', type: 'warning' })} variant="outline">Warning Toast</Button>
                <Button onClick={() => addToast({ title: 'Info', message: 'New update available.', type: 'info' })} variant="outline">Info Toast</Button>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default ComponentShowcase;

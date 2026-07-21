import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Trash2, RefreshCw, Shield, UserCheck } from 'lucide-react'
import { usersService } from '../../services/authService'
import { useToastStore } from '../../stores/toastStore'
import { useAuthStore, type AuthUser } from '../../stores/authStore'
import styles from './Users.module.css'

const ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER',
  'SALES_EXECUTIVE', 'MARKETING', 'CUSTOMER_SUPPORT', 'FINANCE',
]

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'red', ADMIN: 'orange', SALES_MANAGER: 'purple',
  SALES_EXECUTIVE: 'blue', MARKETING: 'green',
  CUSTOMER_SUPPORT: 'teal', FINANCE: 'yellow',
}

const emptyForm = {
  email: '', full_name: '', password: '', role: 'SALES_EXECUTIVE', phone: ''
}

export default function Users() {
  const { addToast } = useToastStore()
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await usersService.list({
        search: search || undefined,
        role: roleFilter || undefined,
      })
      setUsers(res.data)
      setTotal(res.total)
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to load users', message: err.message })
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter])

  useEffect(() => { load() }, [load])

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!form.full_name.trim()) e.full_name = 'Required'
    if (!form.email) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Required'
    else if (form.password.length < 8) e.password = 'Min 8 characters'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setCreating(true)
    try {
      await usersService.create({
        email: form.email,
        full_name: form.full_name,
        password: form.password,
        role: form.role,
        ...(form.phone ? { phone: form.phone } : {}),
      })
      addToast({ type: 'success', title: 'User created', message: `${form.full_name} has been added` })
      setShowCreate(false)
      setForm(emptyForm)
      setFormErrors({})
      load()
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to create user', message: err.message })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (user: AuthUser) => {
    if (!confirm(`Delete "${user.full_name}"? This cannot be undone.`)) return
    setDeletingId(user.id)
    try {
      await usersService.delete(user.id)
      addToast({ type: 'success', title: 'User deleted', message: `${user.full_name} removed` })
      load()
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete failed', message: err.message })
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (user: AuthUser) => {
    setTogglingId(user.id)
    try {
      await usersService.update(user.id, { is_active: !user.is_active })
      addToast({
        type: 'success',
        title: user.is_active ? 'User deactivated' : 'User activated',
        message: user.full_name,
      })
      load()
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update failed', message: err.message })
    } finally {
      setTogglingId(null)
    }
  }

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>{total} user{total !== 1 ? 's' : ''} total</p>
        </div>
        <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.roleSelect}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <button className={styles.refreshBtn} onClick={load} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div
          className={styles.overlay}
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Add New User</h2>
            <form onSubmit={handleCreate} className={styles.modalForm} noValidate>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Full Name</label>
                <input
                  className={`${styles.formInput} ${formErrors.full_name ? styles.formInputError : ''}`}
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
                {formErrors.full_name && <span className={styles.formError}>{formErrors.full_name}</span>}
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={`${styles.formInput} ${formErrors.email ? styles.formInputError : ''}`}
                  placeholder="john@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {formErrors.email && <span className={styles.formError}>{formErrors.email}</span>}
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Phone <span className={styles.optional}>(optional)</span></label>
                <input
                  className={styles.formInput}
                  placeholder="+91 99999 99999"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Password</label>
                <input
                  type="password"
                  className={`${styles.formInput} ${formErrors.password ? styles.formInputError : ''}`}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                {formErrors.password && <span className={styles.formError}>{formErrors.password}</span>}
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Role</label>
                <select
                  className={styles.formInput}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => { setShowCreate(false); setForm(emptyForm); setFormErrors({}) }}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={creating}>
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={20} className={styles.spin} />
            <span>Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>
            <UserCheck size={32} />
            <span>No users found</span>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>{initials(u.full_name)}</div>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{u.full_name}</span>
                        <span className={styles.userEmail}>{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles[`role_${roleColors[u.role] || 'blue'}`]}`}>
                      <Shield size={11} />
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`${styles.statusBadge} ${u.is_active ? styles.statusActive : styles.statusInactive}`}
                      onClick={() => handleToggleActive(u)}
                      disabled={togglingId === u.id}
                      title="Click to toggle"
                    >
                      {togglingId === u.id ? '...' : u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className={styles.lastLogin}>
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })
                      : <span className={styles.never}>Never</span>
                    }
                  </td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(u)}
                      disabled={deletingId === u.id || u.id === currentUser?.id}
                      title={u.id === currentUser?.id ? "Can't delete yourself" : 'Delete user'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
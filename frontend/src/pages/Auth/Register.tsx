import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Phone, Eye, EyeOff, Zap } from 'lucide-react'
import { authService } from '../../services/authService'
import { useToastStore } from '../../stores/toastStore'
import styles from './Auth.module.css'

export default function Register() {
  const navigate = useNavigate()
  const { addToast } = useToastStore()
  const [form, setForm] = useState({
    email: '', full_name: '', password: '', phone: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name.trim()) e.full_name = 'Full name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Minimum 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await authService.register({
        email: form.email,
        full_name: form.full_name,
        password: form.password,
        ...(form.phone ? { phone: form.phone } : {}),
      })
      addToast({
        type: 'success',
        title: 'Account created!',
        message: 'Please sign in with your credentials.',
      })
      navigate('/login')
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Registration failed',
        message: err.message || 'Something went wrong',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><Zap size={20} /></div>
          <span className={styles.logoText}>Sanna CRM</span>
        </div>

        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Get started with Sanna CRM</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Full Name</label>
            <div className={styles.inputWrap}>
              <User size={16} className={styles.inputIcon} />
              <input
                type="text"
                className={`${styles.input} ${errors.full_name ? styles.inputError : ''}`}
                placeholder="John Doe"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                autoFocus
              />
            </div>
            {errors.full_name && <span className={styles.errorMsg}>{errors.full_name}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email address</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Phone <span className={styles.optional}>(optional)</span>
            </label>
            <div className={styles.inputWrap}>
              <Phone size={16} className={styles.inputIcon} />
              <input
                type="tel"
                className={styles.input}
                placeholder="+91 99999 99999"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type={showPass ? 'text' : 'password'}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Create Account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
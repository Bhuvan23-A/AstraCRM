import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import styles from './Auth.module.css'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { addToast } = useToastStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await authService.login(form)
      setAuth(res.access_token, res.user)
      addToast({
        type: 'success',
        title: 'Welcome back!',
        message: `Signed in as ${res.user.full_name}`,
      })
      navigate('/dashboard')
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Login failed',
        message: err.message || 'Invalid email or password',
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

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your account to continue</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
                autoComplete="email"
                autoFocus
              />
            </div>
            {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type={showPass ? 'text' : 'password'}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
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
            {loading ? <span className={styles.spinner} /> : 'Sign In'}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.link}>Create one</Link>
        </p>

        <div className={styles.demoBox}>
          <span className={styles.demoLabel}>Demo credentials</span>
          <code className={styles.demoCode}>admin@astracrm.com / Admin@1234</code>
        </div>
      </div>
    </div>
  )
}
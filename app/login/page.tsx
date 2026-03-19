'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LogIn, Mail, Lock } from 'lucide-react'

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [user, router, searchParams])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
    script.async = true
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const getRecaptchaToken = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      (window as any).grecaptcha.ready(async () => {
        try {
          const token = await (window as any).grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'login' })
          resolve(token)
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = await getRecaptchaToken()

      const verifyRes = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!verifyRes.ok) {
        setError('Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.')
        return
      }

      await signIn(email, password)
      await new Promise(resolve => setTimeout(resolve, 500))

      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.message?.includes('admin')) {
        setError('Bu hesap admin yetkisine sahip değil!')
      } else if (error.code === 'auth/invalid-credential') {
        setError('Email veya şifre hatalı!')
      } else if (error.code === 'auth/user-not-found') {
        setError('Kullanıcı bulunamadı!')
      } else {
        setError('Giriş yapılamadı. Lütfen tekrar deneyin.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-primary rounded-2xl mb-4">
            <LogIn className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Kestir CMS</h1>
          <p className="text-muted-foreground">Yönetim Paneli Girişi</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-border">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Giriş Yap</h2>
            <p className="text-sm text-muted-foreground">Admin hesabınızla giriş yapın</p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-[var(--radius)] text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="admin@kestir.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Yalnızca yetkili personel erişebilir</p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

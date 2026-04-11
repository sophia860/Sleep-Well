import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const email = `${username}@thepagegallery.local`

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        })
        if (authError) throw authError
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md w-full bg-white border border-[#E5DFD2] rounded-3xl p-10 shadow-2xl"
      >
        <h1 className="text-5xl font-display tracking-tighter mb-1">the studio</h1>
        <p className="text-[#6B2A2A] font-mono text-sm">The Page Gallery • The Garden</p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="w-full border border-[#E5DFD2] focus:border-[#6B2A2A] px-6 py-5 rounded-2xl outline-none text-lg"
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border border-[#E5DFD2] focus:border-[#6B2A2A] px-6 py-5 rounded-2xl outline-none text-lg"
          />

          {error && (
            <p className="text-sm text-[#6B2A2A] font-mono">{error}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#6B2A2A] text-white py-6 rounded-3xl text-sm tracking-[2px] disabled:opacity-60"
          >
            {loading ? '...' : isLogin ? 'ENTER THE STUDIO' : 'CREATE ACCOUNT'}
          </motion.button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-xs text-[#6B2A2A] mt-6 underline"
        >
          {isLogin ? 'Need an account?' : 'Already have one?'}
        </button>
      </motion.div>
    </div>
  )
}

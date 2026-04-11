import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { motion, useReducedMotion } from 'framer-motion'

const studioAuthSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').max(32),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type StudioAuthFields = z.infer<typeof studioAuthSchema>

// Supabase requires an email format; we map username → synthetic local email.
// Password reset and email verification are handled separately via the studio admin flow.
function toLocalEmail(username: string): string {
  return `${username}@thepagegallery.local`
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [serverError, setServerError] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudioAuthFields>({
    resolver: zodResolver(studioAuthSchema),
  })

  const onSubmit = async ({ username, password }: StudioAuthFields) => {
    setServerError(null)
    const email = toLocalEmail(username)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        })
        if (error) throw error
      }
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : 'Unable to complete this action — try again.',
      )
    }
  }

  const motionProps = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 } }

  const buttonHoverProps = prefersReducedMotion ? {} : { whileHover: { scale: 1.02 } }

  return (
    <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center p-6">
      <motion.div
        {...motionProps}
        className="max-w-md w-full bg-white border border-[#E5DFD2] rounded-3xl p-10 shadow-2xl"
      >
        <h1 className="text-5xl font-display tracking-tighter mb-1">the studio</h1>
        <p className="text-[#6B2A2A] font-mono text-sm">The Page Gallery • The Garden</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6">
          <div>
            <input
              {...register('username')}
              type="text"
              placeholder="username"
              className="w-full border border-[#E5DFD2] focus:border-[#6B2A2A] px-6 py-5 rounded-2xl outline-none text-lg"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-[#6B2A2A] font-mono">{errors.username.message}</p>
            )}
          </div>

          <div>
            <input
              {...register('password')}
              type="password"
              placeholder="password"
              className="w-full border border-[#E5DFD2] focus:border-[#6B2A2A] px-6 py-5 rounded-2xl outline-none text-lg"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-[#6B2A2A] font-mono">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-[#6B2A2A] font-mono">{serverError}</p>
          )}

          <motion.button
            {...buttonHoverProps}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#6B2A2A] text-white py-6 rounded-3xl text-sm tracking-[2px] disabled:opacity-60"
          >
            {isSubmitting
              ? isLogin ? 'entering the studio…' : 'preparing your space…'
              : isLogin ? 'ENTER THE STUDIO' : 'CREATE ACCOUNT'}
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

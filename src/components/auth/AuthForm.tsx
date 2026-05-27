import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { loginWithEmail, loginWithGoogle, signUpWithEmail } from "@/firebase/auth";
import { FirebaseError } from "firebase/app";

type Mode = "login" | "signup";

const googleIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
    />
  </svg>
);

function friendlyError(e: unknown): string {
  if (e instanceof FirebaseError) {
    const map: Record<string, string> = {
      "auth/invalid-email": "That email doesn't look right.",
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/wrong-password": "Email or password is incorrect.",
      "auth/user-not-found": "No account found with that email.",
      "auth/email-already-in-use": "An account with that email already exists.",
      "auth/weak-password": "Password should be at least 8 characters.",
      "auth/popup-closed-by-user": "Google sign-in was closed before finishing.",
      "auth/popup-blocked": "Popup blocked. Allow popups and try again.",
      "auth/network-request-failed": "Network error. Check your connection.",
    };
    return map[e.code] ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function finishWithRedirect() {
    setSuccess(true);
    // brief, premium "entering the workspace" beat
    await new Promise((r) => setTimeout(r, 650));
    navigate({ to: "/workspace" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      await finishWithRedirect();
    } catch (err) {
      console.error("[AuthForm] submit error:", err);
      setError(friendlyError(err));
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      await finishWithRedirect();
    } catch (err) {
      console.error("[AuthForm] google error:", err);
      setError(friendlyError(err));
      setGoogleLoading(false);
    }
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {success && (
          <motion.div
            key="success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Check size={22} strokeWidth={2.4} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-[14px] font-medium text-foreground"
            >
              Entering your workspace…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ opacity: success ? 0.35 : 1, filter: success ? "blur(2px)" : "blur(0px)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          whileHover={{ y: -1.5, boxShadow: "0 10px 24px -12px rgba(15, 15, 30, 0.18)" }}
          whileTap={{ scale: 0.985, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.6 }}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-white px-4 py-3 text-[14px] font-medium text-foreground shadow-[0_1px_0_rgba(15,15,30,0.04)] transition-colors duration-300 ease-out hover:border-border/80 hover:bg-[color-mix(in_oklab,var(--surface-muted)_60%,white)] disabled:opacity-70"
        >
          {googleLoading ? <Loader2 size={16} className="animate-spin" /> : googleIcon}
          Continue with Google
        </motion.button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-soft" />
          <span className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border-soft" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <Field
              id="name"
              label="Full name"
              icon={<User size={16} />}
              type="text"
              placeholder="Ada Lovelace"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <Field
            id="email"
            label="Email"
            icon={<Mail size={16} />}
            type="email"
            placeholder="you@team.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-[13px] font-medium text-foreground/80">
                Password
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  className="text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="group relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock size={16} />
              </span>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"}
                className="w-full rounded-xl border border-border bg-white py-3 pl-9 pr-10 text-[14px] text-foreground placeholder:text-muted-foreground/70 transition-shadow focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-[13px] text-rose-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading || googleLoading}
            whileHover={{
              y: -1.5,
              boxShadow: "0 16px 32px -14px color-mix(in oklab, var(--primary) 80%, transparent)",
            }}
            whileTap={{ scale: 0.985, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.6 }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14px] font-medium text-primary-foreground shadow-[0_10px_24px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] ring-1 ring-inset ring-white/10 transition-shadow duration-300 ease-out disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {mode === "signup" ? "Create account" : "Log in"}
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  ...rest
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-foreground/80">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <input
          id={id}
          {...rest}
          className="w-full rounded-xl border border-border bg-white py-3 pl-9 pr-3 text-[14px] text-foreground placeholder:text-muted-foreground/70 transition-shadow focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
        />
      </div>
    </div>
  );
}

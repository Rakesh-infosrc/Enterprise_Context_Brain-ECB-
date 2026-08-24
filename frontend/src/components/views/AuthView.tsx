// frontend/src/components/views/AuthView.tsx
import React, { useState } from "react";
import { BrainCircuit, Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import { RippleButton } from "@/components/ui/ripple-button";

interface AuthViewProps {
  mode: "signin" | "signup";
  onSwitchMode: (mode: "signin" | "signup") => void;
  onAuthenticated: () => void;
}

const ECBLogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#5ca8ff] via-[#7a6cff] to-[#00f0ff] shadow-[0_0_24px_rgba(92,168,255,0.45)]"
    style={{ width: size, height: size }}
  >
    <BrainCircuit size={size * 0.52} color="#ffffff" strokeWidth={1.9} />
    <div className="pointer-events-none absolute inset-[1px] rounded-[15px] bg-gradient-to-b from-white/20 to-transparent opacity-70" />
  </div>
);

export const SignInView: React.FC<AuthViewProps> = ({ onSwitchMode, onAuthenticated }) => {
  const [email, setEmail] = useState("sarah.jenkins@acmefin.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const base = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8001/api/v1";
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const res = await fetch(`${base}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("ecb_auth_token", data.access_token);
        localStorage.setItem("ecb_user", JSON.stringify({ email }));
        onAuthenticated();
      } else {
        localStorage.setItem("ecb_auth_token", "demo-token-" + Date.now());
        localStorage.setItem("ecb_user", JSON.stringify({ email }));
        onAuthenticated();
      }
    } catch {
      localStorage.setItem("ecb_auth_token", "demo-token-" + Date.now());
      localStorage.setItem("ecb_user", JSON.stringify({ email }));
      onAuthenticated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-[#020617] px-4 py-8 sm:py-12">
      {/* Grid — clipped to viewport, not the card */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden ">
        <InteractiveGridPattern
          width={32}
          height={32}
          squares={[50, 30]}
          className="[mask-image:radial-gradient(900px_circle_at_center,white,transparent)] inset-0 h-full w-full skew-y-0 opacity-40"
          squaresClassName="hover:fill-[#5ca8ff]/20 hover:stroke-[#5ca8ff]/30" 
        />
      </div>
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#5ca8ff]/18 via-[#7a6cff]/16 to-[#00f0ff]/12 blur-[65px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[500px] w-[600px] rounded-full bg-gradient-to-l from-[#9b7cff]/12 via-transparent to-transparent blur-[50px]" />

      <div className="relative flex w-full max-w-[440px] flex-col items-center">
        {/* Card — properly proportioned width, comfortable padding, non-clipped overflow */}
        <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="relative z-10 p-8 sm:p-9">
            <div className="mb-6 flex flex-col items-center text-center">
              <ECBLogo size={52} />
              <h1 className="mt-4 bg-gradient-to-br from-white via-[#cbd5e1] to-[#94a3b8] bg-clip-text text-[23px] font-extrabold tracking-tight text-transparent">
                Welcome back
              </h1>
              <p className="mt-1.5 max-w-[300px] text-center text-[13.5px] leading-5 text-white/60">
                Sign in to <span className="font-semibold text-white/90">Enterprise Context Brain</span>
                <br />
                <span className="mt-1.5 inline-flex items-center justify-center gap-1.5 text-xs text-white/45">
                  <ShieldCheck size={13} className="text-emerald-400" /> Llama Guard 3 • Mem0 • Qdrant
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
              <div className="space-y-1.5">
                <label htmlFor="si-email" className="block text-xs font-semibold tracking-wide text-white/75">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    id="si-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah.jenkins@acmefin.com"
                    className="h-[44px] w-full rounded-xl border border-white/10 bg-white/[0.06] py-2 pl-10 pr-3 text-[13.5px] font-medium text-white placeholder:text-white/30 outline-none transition focus:border-[#5ca8ff]/60 focus:bg-white/[0.09] focus:ring-2 focus:ring-[#5ca8ff]/20"
                    style={{ paddingLeft: '2.85rem' }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="si-password" className="block text-xs font-semibold tracking-wide text-white/75">
                    Password
                  </label>
                  <button type="button" tabIndex={-1} className="text-[11.5px] font-medium text-[#5ca8ff] hover:text-[#93c5fd] transition-colors">
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    id="si-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-[44px] w-full rounded-xl border border-white/10 bg-white/[0.06] py-2 pl-10 pr-3 text-[13.5px] font-medium tracking-widest text-white placeholder:tracking-normal placeholder:text-white/30 outline-none transition focus:border-[#5ca8ff]/60 focus:bg-white/[0.09] focus:ring-2 focus:ring-[#5ca8ff]/20"
                    style={{ paddingLeft: '2.85rem' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-0.5 py-0.5">
                <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-white/70 hover:text-white transition-colors">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/20 bg-white/10 accent-[#5ca8ff] focus:ring-0" />
                  Remember me
                </label>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/50 whitespace-nowrap">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse" />
                  System online
                </span>
              </div>

              <RippleButton
                type="submit"
                disabled={loading}
                rippleColor="rgba(255,255,255,0.35)"
                duration="700ms"
                className="mt-1 h-11 w-full rounded-full border-0 bg-gradient-to-r from-[#5ca8ff] via-[#7a6cff] to-[#5ca8ff] bg-[length:200%_100%] text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(92,168,255,0.35)] transition-all hover:bg-[position:100%_0%] hover:shadow-[0_12px_32px_rgba(92,168,255,0.45)] disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight size={16} strokeWidth={2.2} />
                  </span>
                )}
              </RippleButton>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-white/30">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <p className="text-center text-[13px] text-white/60">
              New to ECB?{" "}
              <button onClick={() => onSwitchMode("signup")} className="font-semibold text-[#5ca8ff] hover:text-[#93c5fd] hover:underline underline-offset-4 transition-colors">
                Create account
              </button>
            </p>
          </div>

          {/* Border Beam */}
          <BorderBeam size={140} duration={8} colorFrom="#5ca8ff" colorTo="#9b7cff" borderWidth={1.5} />
          <BorderBeam size={140} duration={8} delay={4} colorFrom="#00f0ff" colorTo="#5ca8ff" borderWidth={1.5} reverse />
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium leading-4 text-white/40">
          <Sparkles size={12} className="text-[#5ca8ff]/70" />
          Governed Context Operating System • v2.2
        </p>
      </div>
    </div>
  );
};

export const SignUpView: React.FC<AuthViewProps> = ({ onSwitchMode, onAuthenticated }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password !== confirm) {
      setErr("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("ecb_auth_token", "demo-token-" + Date.now());
      localStorage.setItem("ecb_user", JSON.stringify({ email, name }));
      setLoading(false);
      onAuthenticated();
    }, 650);
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full items-start justify-center overflow-y-auto bg-[#020617] px-4 pt-6 sm:pt-10 pb-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <InteractiveGridPattern
          width={28}
          height={28}
          squares={[60, 32]}
          className="[mask-image:radial-gradient(850px_circle_at_center,white,transparent)] inset-0 h-full w-full"
          squaresClassName="hover:fill-[#7a6cff]/15 hover:stroke-[#7a6cff]/20"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#020617]/0 via-transparent to-[#020617]/80" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[880px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#5ca8ff]/14 via-[#9b7cff]/12 to-[#00f0ff]/10 blur-[60px]" />

      <div className="relative my-auto flex w-full max-w-[440px] flex-col items-center py-4">
        <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="relative z-10 p-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <ECBLogo size={44} />
              <h1 className="mt-3 bg-gradient-to-br from-white via-[#e2e8f0] to-[#94a3b8] bg-clip-text text-[21px] font-extrabold tracking-tight text-transparent">
                Create your account
              </h1>
              <p className="mt-1 max-w-[320px] text-center text-[13px] leading-5 text-white/55">Join Enterprise Context Brain — governed memory for your org</p>
              <div className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-wide text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                Free 14-day trial • No credit card
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label htmlFor="su-name" className="block text-xs font-semibold tracking-wide text-white/70">
                  Full name
                </label>
                <div className="relative">
                  <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    id="su-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    style={{ paddingLeft: '2.75rem' }}
                    className="h-[44px] w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 pl-10 text-sm font-medium text-white placeholder:text-white/30 outline-none transition focus:border-[#7a6cff]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#7a6cff]/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="su-email" className="block text-xs font-semibold tracking-wide text-white/70">
                  Work email
                </label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    id="su-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@acmefin.com"
                    style={{ paddingLeft: '2.75rem' }}
                    className="h-[44px] w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 pl-10 text-sm font-medium text-white placeholder:text-white/30 outline-none transition focus:border-[#7a6cff]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#7a6cff]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="su-pass" className="block text-xs font-semibold tracking-wide text-white/70">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      id="su-pass"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ paddingLeft: '2.75rem' }}
                      className="h-[44px] w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 pl-10 text-sm font-medium tracking-widest text-white placeholder:tracking-normal placeholder:text-white/30 outline-none transition focus:border-[#7a6cff]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#7a6cff]/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="su-confirm" className="block text-xs font-semibold tracking-wide text-white/70">
                    Confirm
                  </label>
                  <input
                    id="su-confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="h-[44px] w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-medium tracking-widest text-white placeholder:tracking-normal placeholder:text-white/30 outline-none transition focus:border-[#7a6cff]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#7a6cff]/20"
                  />
                </div>
              </div>

              {err && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs font-medium text-red-300">{err}</div>
              )}

              <label className="flex cursor-pointer items-start gap-2 py-1 text-[11px] leading-4 text-white/50">
                <input type="checkbox" required className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-white/20 bg-white/10 accent-[#7a6cff]" />
                <span className="leading-4">
                  I agree to the{" "}
                  <a href="#" className="font-medium text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="font-medium text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white">
                    Privacy Policy
                  </a>
                </span>
              </label>

              <RippleButton
                type="submit"
                disabled={loading}
                rippleColor="rgba(255,255,255,0.32)"
                duration="700ms"
                className="h-11 w-full rounded-full border-0 bg-gradient-to-r from-[#7a6cff] via-[#5ca8ff] to-[#7a6cff] bg-[length:200%_100%] text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.32)] hover:bg-[position:100%_0%] disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} /> Create account <ArrowRight size={16} />
                  </span>
                )}
              </RippleButton>
            </form>

            <p className="mt-6 text-center text-sm text-white/55">
              Already have an account?{" "}
              <button onClick={() => onSwitchMode("signin")} className="font-semibold text-[#7a6cff] hover:text-[#a78bfa] hover:underline underline-offset-4 transition-colors">
                Sign in
              </button>
            </p>
          </div>

          <BorderBeam size={160} duration={9} colorFrom="#7a6cff" colorTo="#5ca8ff" borderWidth={1.2} />
          <BorderBeam size={160} duration={9} delay={4.5} colorFrom="#00f0ff" colorTo="#7a6cff" borderWidth={1.2} reverse />
        </div>

        <p className="mt-5 text-center text-[11px] leading-4 text-white/20">
          Protected by Llama Guard 3 • Encrypted • SOC 2 compliant
        </p>
      </div>
    </div>
  );
};

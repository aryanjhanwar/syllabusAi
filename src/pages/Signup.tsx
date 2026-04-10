import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, UserPlus, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const inputCls = "pl-10 h-11 bg-[hsl(222,35%,12%)] border-border/40 rounded-xl text-sm placeholder:text-muted-foreground/30 focus:border-primary/40 focus:ring-1 focus:ring-primary/15";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !confirmPassword) { toast({ title: "Please fill in all fields", variant: "destructive" }); return; }
    if (password !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (password.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
    setLoading(false);
    if (error) toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Account created!", description: "You can now sign in." }); navigate("/login"); }
  };

  return (
    <div className="min-h-screen gradient-bg mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-primary/[0.07] blur-[110px] animate-float" />
        <div className="absolute -bottom-24 -left-24 w-[480px] h-[480px] rounded-full bg-accent/[0.05] blur-[130px] animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 w-full max-w-[400px]">
        <div className="text-center mb-7">
          <div className="inline-flex w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 items-center justify-center mb-3">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Create Account</h1>
          <p className="text-xs text-muted-foreground/60 mt-1">Start mapping your knowledge</p>
        </div>

        <form onSubmit={handleSignup} className="glass-strong rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-email" className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input id="s-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-pw" className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input id="s-pw" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-cpw" className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input id="s-cpw" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground glow-btn disabled:opacity-30 disabled:shadow-none">
            {loading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground/50 pt-1">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

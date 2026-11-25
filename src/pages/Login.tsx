import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { forgotPasswordNavigation } from "@/lib/setPassword";
import { toast } from "@/hooks/use-toast";
import i18n from "@/i18n";
import { consumeSignOutReason, writeStoredActivity } from "@/lib/idleSessionChannel";
import { login as authLogin } from "@/services/networks/graphql/admin";
import { setAccessToken, setRefreshToken, setUserId, setUserEmail, setAdminProfile } from "@/stores/session";
import { useSessionStore } from "@/stores/sessionStore";
import { useSessionStoreHydrated } from "@/hooks/useSessionStoreHydrated";
import { SessionHydrationFallback } from "@/components/auth/SessionHydrationFallback";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionHydrated = useSessionStoreHydrated();
  const sessionId = useSessionStore((s) => s.sessionId);

  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      toast({
        title: "Session expired",
        description: "Your session could not be refreshed. Please sign in again.",
        variant: "destructive",
      });
      const next = new URLSearchParams(searchParams);
      next.delete("expired");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // After an inactivity / expired sign-out: say why, once.
  useEffect(() => {
    const reason = consumeSignOutReason();
    if (!reason) return;
    const k = reason === "idle" ? "signedOutIdle" : "signedOutExpired";
    toast({ title: i18n.t(`idleSession.${k}Title`), description: i18n.t(`idleSession.${k}Body`) });
  }, []);

  // After the set-password page: confirm once, then drop the flag from the address.
  useEffect(() => {
    if (searchParams.get("passwordSet") !== "1") return;
    toast({
      title: i18n.t("setPassword.successTitle"),
      description: i18n.t("setPassword.successBody"),
    });
    const next = new URLSearchParams(searchParams);
    next.delete("passwordSet");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // If already authenticated, redirect to intended page or home (after persist rehydration)
  useEffect(() => {
    if (!sessionHydrated || !sessionId) return;
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    navigate(from ?? "/", { replace: true });
  }, [sessionHydrated, sessionId, location.state, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const result = await authLogin(email, password);
    
    if (result.ok) {
      writeStoredActivity(Date.now()); // a fresh sign-in is activity (a stale value must not sign it straight out)
      setAccessToken(result.data.accessToken);
      setRefreshToken(result.data.refreshToken ?? null);
      setUserId(result.data.admin?.userId ?? null);
      setUserEmail(result.data.email ?? email);
      setAdminProfile(result.data.admin ?? null);

      setIsLoading(false);
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting to dashboard...",
      });
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from ?? "/", { replace: true });
    } else {
      const err = (result as { ok: false; error: { message: string } }).error;
      setIsLoading(false);
      toast({
        title: "Login Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (!sessionHydrated || sessionId) {
    return <SessionHydrationFallback />;
  }

  // "Forgot password?" is the real one-time-code flow on /set-password. The typed email is
  // handed over in router state (never in the URL, which gets logged).
  const handleForgotPassword = () => {
    const { to, state } = forgotPasswordNavigation(email);
    navigate(to, { state });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">D</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">DiaspoPlug</h1>
            <p className="text-sm text-muted-foreground">Admin Portal</p>
          </div>

          {/* Login Card */}
          <Card className="border-border">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in with a system, community, or association administrator account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                      aria-label="Admin Email"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" role="alert" className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                      aria-label="Admin Password"
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" role="alert" className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  aria-label="Login to Admin Dashboard"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>

              {/* Security Note */}
              <p className="mt-4 text-xs text-center text-muted-foreground">
                Sessions expire after inactivity for security.
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            © 2024 DiaspoPlug. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Illustration (Desktop Only) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12">
        <div className="max-w-lg text-center space-y-6">
          <div className="text-8xl">🌍</div>
          <h2 className="text-3xl font-bold text-foreground">
            Connect Your Community
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage your diaspora association with powerful tools for members, events, opportunities, and more.
          </p>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-success" />
              Secure & Private
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-info" />
              Real-time Updates
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
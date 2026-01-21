import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Building2, Loader2 } from "lucide-react";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const updatePasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, resetPassword, loading: authLoading } = useAuth();
  const { settings, systemName, isLoading: settingsLoading } = useSystemSettingsContext();
  const [activeTab, setActiveTab] = useState("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isRecovery = searchParams.get("type") === "recovery";
  const logoUrl = settings.branding?.logo_url;
  const faviconUrl = settings.branding?.favicon_url;

  useEffect(() => {
    if (user && !authLoading && !isRecovery) {
      navigate("/");
    }
  }, [user, authLoading, navigate, isRecovery]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const updatePasswordForm = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/");
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    const { error } = await resetPassword(data.email);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email Sent",
        description: "If an account exists for this email, you will receive a password reset link.",
      });
      setActiveTab("login");
    }
  };

  const handleUpdatePassword = async (data: UpdatePasswordFormData) => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully. You can now login.",
      });
      navigate("/auth", { replace: true });
    }
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 3, delay: 1, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/30 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="shadow-elevated border-none bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="mx-auto w-20 h-20 flex items-center justify-center overflow-hidden mb-2"
            >
              {faviconUrl ? (
                <img src={faviconUrl} alt="Favicon" className="w-full h-full object-contain" />
              ) : logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="h-14 w-14 text-primary" />
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="font-display text-4xl font-black text-black uppercase tracking-tighter">
                URBAN HUB
              </CardTitle>
              <CardDescription className="mt-2 text-muted-foreground font-medium">
                {isRecovery ? "Reset your password" : "Student accommodation leads management"}
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {isRecovery ? (
                <motion.form 
                  key="recovery"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={updatePasswordForm.handleSubmit(handleUpdatePassword)} 
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      {...updatePasswordForm.register("password")}
                      className={updatePasswordForm.formState.errors.password ? "border-destructive" : ""}
                    />
                    {updatePasswordForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {updatePasswordForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      {...updatePasswordForm.register("confirmPassword")}
                      className={updatePasswordForm.formState.errors.confirmPassword ? "border-destructive" : ""}
                    />
                    {updatePasswordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {updatePasswordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </motion.form>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                    <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Login</TabsTrigger>
                    <TabsTrigger value="forgot-password" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Forgot Password</TabsTrigger>
                  </TabsList>

                  <AnimatePresence mode="wait">
                    {activeTab === "login" ? (
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="you@email.com"
                              {...loginForm.register("email")}
                              className={loginForm.formState.errors.email ? "border-destructive" : ""}
                            />
                            {loginForm.formState.errors.email && (
                              <p className="text-sm text-destructive">
                                {loginForm.formState.errors.email.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="login-password">Password</Label>
                              <button
                                type="button"
                                onClick={() => setActiveTab("forgot-password")}
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors focus:outline-none"
                              >
                                Forgot password?
                              </button>
                            </div>
                            <Input
                              id="login-password"
                              type="password"
                              placeholder="••••••••"
                              {...loginForm.register("password")}
                              className={loginForm.formState.errors.password ? "border-destructive" : ""}
                            />
                            {loginForm.formState.errors.password && (
                              <p className="text-sm text-destructive">
                                {loginForm.formState.errors.password.message}
                              </p>
                            )}
                          </div>
                          <Button type="submit" className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Logging in...
                              </>
                            ) : (
                              "Login"
                            )}
                          </Button>
                        </form>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="forgot-password"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="forgot-email">Email</Label>
                            <Input
                              id="forgot-email"
                              type="email"
                              placeholder="you@email.com"
                              {...forgotPasswordForm.register("email")}
                              className={forgotPasswordForm.formState.errors.email ? "border-destructive" : ""}
                            />
                            {forgotPasswordForm.formState.errors.email && (
                              <p className="text-sm text-destructive">
                                {forgotPasswordForm.formState.errors.email.message}
                              </p>
                            )}
                          </div>
                          <Button type="submit" className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending email...
                              </>
                            ) : (
                              "Reset Password"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full transition-all hover:bg-muted"
                            onClick={() => setActiveTab("login")}
                            disabled={isSubmitting}
                          >
                            Back to login
                          </Button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Tabs>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

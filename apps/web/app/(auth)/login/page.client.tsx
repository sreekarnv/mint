"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth.store";
import { ApiError } from "@/lib/api/client";
import { loginSchema, type LoginInput } from "@/lib/validators/auth.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export function LoginClient() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: LoginInput) {
    try {
      await authApi.login(data);
      const user = await authApi.me();
      setUser(user);
      router.push(user.role === "ADMIN" ? "/app-admin/dashboard" : "/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed");
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
      <div className="mb-7">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your Mint account</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      </Form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

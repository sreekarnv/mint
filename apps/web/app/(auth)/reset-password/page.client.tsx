"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validators/auth.schemas";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: ResetPasswordInput) {
    if (!token) return;
    try {
      await authApi.resetPassword({ token, password: data.password });
      toast.success("Password reset successfully");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Reset failed");
    }
  }

  if (!token) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm text-center">
        <XCircle className="h-10 w-10 mx-auto mb-4 text-destructive" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Invalid link</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Set new password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset password
          </Button>
        </form>
      </Form>
    </div>
  );
}

export function ResetPasswordClient() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

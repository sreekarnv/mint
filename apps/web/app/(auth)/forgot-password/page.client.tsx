"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validators/auth.schemas";
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

export function ForgotPasswordClient() {
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: ForgotPasswordInput) {
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Request failed");
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Reset your password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      {sent ? (
        <div className="flex flex-col items-center text-center py-2">
          <MailCheck className="h-10 w-10 text-emerald-500 mb-3" />
          <p className="text-sm text-muted-foreground">
            If an account exists for this email, you&apos;ll receive a reset link shortly.
          </p>
        </div>
      ) : (
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send reset link
            </Button>
          </form>
        </Form>
      )}

      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}

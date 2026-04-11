"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth.store";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!token) return;
    authApi
      .verifyEmail(token)
      .then(async () => {
        setStatus("success");
        try {
          const user = await authApi.me();
          setUser(user);
          router.replace("/dashboard");
        } catch {
          // Not logged in — redirect to login
          router.replace("/login");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-card border border-border rounded-xl p-8 shadow-sm text-center">
      {(status === "loading" || status === "success") && (
        <>
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            {status === "success" ? "Redirecting..." : "Verifying your email..."}
          </h2>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-10 w-10 mx-auto mb-4 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Verification failed</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This link is invalid or has expired.
          </p>
          <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Back to login
          </Link>
        </>
      )}
    </div>
  );
}

export function VerifyEmailClient() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

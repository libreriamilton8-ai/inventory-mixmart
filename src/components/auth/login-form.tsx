"use client";

import { Loader2, LockKeyhole, LogIn, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useToast } from "@/components/shared/toast";

type LoginFormProps = {
  callbackUrl: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      identifier,
      password,
      callbackUrl,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!result?.ok) {
      toast({
        title: "No se pudo iniciar sesion.",
        description: "Revisa tus datos e intenta de nuevo.",
        type: "error",
      });
      return;
    }

    router.push(result.url ?? callbackUrl);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setIsGoogleSubmitting(true);
    await signIn("google", { callbackUrl });
    setIsGoogleSubmitting(false);
  }

  return (
    <div className="space-y-3">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="identifier">
            Usuario o correo
          </label>
          <div className="relative">
            <UserRound
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              autoComplete="username"
              className="input pl-10"
              id="identifier"
              name="identifier"
              placeholder="admin o correo@ejemplo.com"
              required
              type="text"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="password">
            Contrasena
          </label>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              autoComplete="current-password"
              className="input pl-10"
              id="password"
              name="password"
              placeholder="Ingresa tu contrasena"
              required
              type="password"
            />
          </div>
        </div>

        <button
          className="btn btn-primary mt-2 w-full shadow-soft"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Ingresando...
            </>
          ) : (
            <>
              <LogIn aria-hidden="true" className="h-4 w-4" />
              Iniciar sesion
            </>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>o continua con</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        className="btn btn-ghost w-full border border-border bg-surface-elevated hover:border-primary-200 hover:bg-primary-50"
        disabled={isGoogleSubmitting}
        onClick={handleGoogleSignIn}
        type="button"
      >
        {isGoogleSubmitting ? (
          <>
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold text-foreground"
            >
              G
            </span>
            Google
          </>
        )}
      </button>
    </div>
  );
}

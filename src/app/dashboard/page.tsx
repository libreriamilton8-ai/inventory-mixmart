import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireActiveUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireActiveUser("/dashboard");

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Sesión activa</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Bienvenido, {user.firstName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta es una página temporal. El panel principal se implementará después.
            </p>
          </div>
          <SignOutButton />
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <article className="card p-4">
            <p className="text-sm text-muted-foreground">Rol</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{user.role}</p>
          </article>
          <article className="card p-4 sm:col-span-2">
            <p className="text-sm text-muted-foreground">Correo</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{user.email}</p>
          </article>
        </div>
      </section>
    </main>
  );
}

import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: "hsl(var(--surface-canvas))" }}
        >
          <div
            className="h-8 w-8 animate-spin rounded-full border-4"
            style={{ borderColor: "hsl(var(--accent))", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

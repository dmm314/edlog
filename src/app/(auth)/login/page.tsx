import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--header-from) 0%, var(--header-via) 50%, var(--header-to) 100%)" }}>
          <div className="animate-spin h-8 w-8 border-4 rounded-full" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

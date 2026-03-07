import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
          <div className="animate-spin h-8 w-8 border-4 rounded-full" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

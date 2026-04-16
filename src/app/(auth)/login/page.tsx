import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        /* Always-dark fallback matches LoginForm's forced-dark canvas */
        <div
          className="dark flex min-h-screen items-center justify-center"
          style={{ background: "hsl(220, 10%, 8%)", colorScheme: "dark" }}
        >
          <div
            className="h-8 w-8 animate-spin rounded-full border-4"
            style={{ borderColor: "#0866FF", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

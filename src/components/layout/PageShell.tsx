import { cn } from "@/lib/utils";

interface PageShellProps {
  maxWidth?: "narrow" | "medium" | "wide";
  children: React.ReactNode;
  className?: string;
}

const widthClasses = {
  narrow: "max-w-[640px]",
  medium: "max-w-[960px]",
  wide: "max-w-[1280px]",
} as const;

export function PageShell({ maxWidth = "narrow", children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pb-28 pt-8 sm:px-6 lg:pb-8 lg:pt-10 xl:px-8",
        widthClasses[maxWidth],
        className,
      )}
    >
      {children}
    </div>
  );
}

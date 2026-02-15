import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof Loader2Icon>) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: loading indicator; output element not appropriate here
    <Loader2Icon
      aria-label="Loading"
      className={cn("animate-spin", className)}
      role="status"
      {...props}
    />
  );
}

export { Spinner };

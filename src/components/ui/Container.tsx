import type { ReactNode } from "react";

type ContainerWidth = "narrow" | "medium" | "default" | "wide";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  width?: ContainerWidth;
};

const WIDTH_CLASSES: Record<ContainerWidth, string> = {
  narrow: "max-w-2xl",
  medium: "max-w-4xl",
  default: "max-w-5xl",
  wide: "max-w-6xl",
};

export function Container({ children, className = "", width = "default" }: ContainerProps) {
  return (
    <div className={`mx-auto w-full px-6 md:px-10 ${WIDTH_CLASSES[width]} ${className}`.trim()}>
      {children}
    </div>
  );
}

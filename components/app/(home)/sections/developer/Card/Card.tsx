import { CurvyRect } from "@/components/shared/ui";
import { cn } from "@/lib/utils";

interface DeveloperCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.FC;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function DeveloperCard(props: DeveloperCardProps) {
  return (
    <div className={cn("relative", props.className)}>
      <div className="overlay border-x border-border-faint pointer-events-none" />

      <div className="flex w-full -mt-1 relative h-312">
        <CurvyRect className="overlay z-[3]" allSides />

        {props.children}
      </div>

      <div className="-mt-1 p-32 lg:py-60 lg:pl-64 lg:pr-72 w-full border-t z-[2] border-border-faint relative">
        <CurvyRect
          className="absolute -top-1 h-[calc(100%+1px)] left-0 w-full"
          allSides
        />

        <div className="flex gap-8 items-center text-label-small text-black-alpha-64 mb-16">
          <props.icon />
          {props.subtitle}
        </div>

        <h3 className="text-label-x-large text-accent-black mb-8">
          {props.title}
        </h3>

        <div className="text-body-large max-w-330 text-black-alpha-72 mb-24">
          {props.description}
        </div>

        {props.action && <div className="mt-24">{props.action}</div>}
      </div>
    </div>
  );
}

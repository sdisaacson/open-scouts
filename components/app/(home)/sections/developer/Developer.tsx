import Link from "next/link";

import CurvyRect from "@/components/shared/layout/curvy-rect";
import SectionHead from "@/components/shared/section-head/SectionHead";

import BadgeIcon from "./_svg/BadgeIcon";
import IntegrationsIcon from "./_svg/IntegrationsIcon";
import OpenSourceIcon from "./_svg/OpenSourceIcon";
import DeveloperCard from "./Card/Card";
import DeveloperFeatures from "./Features/Features";
import DeveloperFlame from "./Flame/Flame";
import DeveloperTitleHighlight from "./Highlight/Highlight";
import DeveloperIntegrations from "./Integrations/Integrations";
import DeveloperOs from "./Os/Os";
import Button from "@/components/ui/shadcn/button";

export default function Developer() {
  return (
    <section className="container -mt-1">
      <SectionHead
        badgeContent={
          <>
            <BadgeIcon />
            <div>Developer First</div>
          </>
        }
        description="Enhance your apps with industry leading web scraping and crawling capabilities."
        titleShadow={false}
        title={
          <>
            Start{" "}
            <span className="text-heat-100">
              <DeveloperTitleHighlight />
            </span>{" "}
            <br className="lg:hidden" /> today
          </>
        }
      >
        <DeveloperFlame />
      </SectionHead>

      <DeveloperFeatures />

      <div className="h-92 relative -mt-1 z-[2]">
        <CurvyRect className="overlay" allSides />
        <div className="h-1 bg-border-faint bottom-0 left-0 w-full absolute" />
      </div>

      <div className="lg:grid grid-cols-2 relative gap-16">
        <div className="h-1 bg-border-faint w-full absolute bottom-0 left-0" />

        <CurvyRect
          className="lg-max:hidden w-18 h-[calc(100%+1px)] left-[calc(50%-9px)] absolute -top-1"
          allSides
        />

        <DeveloperCard
          action={
            <Link className="contents" href="/app">
              <Button size="large" variant="secondary">
                See all integrations
              </Button>
            </Link>
          }
          description="Already fully integrated with the greatest existing tools and workflows."
          icon={IntegrationsIcon}
          subtitle="Integrations"
          title="Use well-known tools"
        >
          <DeveloperIntegrations />
        </DeveloperCard>

        <div className="lg:hidden -mt-1 h-52 relative border-y border-border-faint">
          <CurvyRect
            className="h-[calc(100%+2px)] absolute -top-1 left-0 w-full"
            allSides
          />
        </div>

        <DeveloperCard
          description="Developed transparently and collaboratively. Join our community of contributors."
          icon={OpenSourceIcon}
          subtitle="Open Source"
          title="Code you can trust"
        >
          <DeveloperOs />
        </DeveloperCard>
      </div>
    </section>
  );
}

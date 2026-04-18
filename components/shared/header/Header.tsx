import Link from "next/link";
import Button from "../button/Button";
import { Connector } from "../layout/curvy-rect";
import HeaderDropdownWrapper from "./Dropdown/Wrapper/Wrapper";
import HeaderNav from "./Nav/Nav";
import HeaderWrapper from "./Wrapper/Wrapper";
import HeaderToggle from "./Toggle/Toggle";
import HeaderDropdownMobile from "./Dropdown/Mobile/Mobile";
import HeaderCTA from "./cta/CTA";
import UserMenu from "./UserMenu/UserMenu";

export default function Header() {
  return (
    <>
      <HeaderDropdownWrapper />

      <div className="sticky top-0 left-0 w-full z-[101] bg-background-base header">
        <div className="absolute top-0 cmw-container border-x border-border-faint h-full pointer-events-none" />

        <div className="h-1 bg-border-faint w-full left-0 -bottom-1 absolute" />

        <div className="cmw-container absolute h-full pointer-events-none top-0">
          <Connector className="absolute -left-[10.5px] -bottom-11" />
          <Connector className="absolute -right-[10.5px] -bottom-11" />
        </div>

        <HeaderWrapper>
          <div className="flex gap-24 items-center">
            <Link
              className="text-lg text-accent-black no-underline hover:no-underline"
              href="/"
            >
              Open Scouts
            </Link>
          </div>

          <div className="flex gap-24 items-center lg-max:hidden">
            <HeaderNav />
            <div className="text-black-alpha-16 text-label-medium select-none">
              ·
            </div>
            <div className="flex gap-8 items-center">
              <UserMenu />
            </div>
          </div>

          <HeaderToggle
            dropdownContent={
              <HeaderDropdownMobile ctaContent={<HeaderCTA />} />
            }
          />
        </HeaderWrapper>
      </div>
    </>
  );
}

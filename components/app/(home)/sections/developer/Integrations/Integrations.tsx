"use client";

import { animate } from "motion";
import { HTMLAttributes, useEffect, useRef } from "react";

import data from "@/components/shared/effects/flame/explosion-data.json";
import Image from "@/components/shared/image/Image";
import { cn } from "@/lib/utils";
import { sleep } from "@/utils/sleep";
import { animateOnVisible } from "@/utils/animate-on-visible";

export default function DeveloperIntegrations() {
  const iconsRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);
  const explosionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if refs are properly set
    if (!linkRef.current || !iconsRef.current || !explosionRef.current) {
      return;
    }

    const leftWing = linkRef.current.children[0] as HTMLElement;
    const line = linkRef.current.children[1] as HTMLDivElement;
    const rightWing = linkRef.current.children[2] as HTMLElement;
    const oldLeftWingD = (leftWing.children[0] as SVGPathElement).getAttribute(
      "d",
    );
    const oldRightWingD = (
      rightWing.children[0] as SVGPathElement
    ).getAttribute("d");

    const triggerIconAnimation = async () => {
      if (!linkRef.current) return;

      await Promise.all([
        animate(leftWing, { x: -3 }, { visualDuration: 0.05 }),
        animate(line, { scaleX: 1.45 }, { visualDuration: 0.05 }),
        animate(rightWing, { x: 3 }, { visualDuration: 0.05 }),
      ]);

      await sleep(100);

      if (!linkRef.current) return;

      await Promise.all([
        animate(
          linkRef.current,
          { color: "#FA5D19" },
          { type: "spring", stiffness: 2000, damping: 40 },
        ),
        animate(
          leftWing,
          { x: 0 },
          { type: "spring", stiffness: 2000, damping: 40 },
        ),
        animate(
          leftWing.children[0] as SVGPathElement,
          {
            d: "M20 15H15.5C13.0147 15 11 17.0147 11 19.5V19.5C11 21.9853 13.0147 24 15.5 24H20",
          },
          { type: "spring", stiffness: 2000, damping: 40 },
        ),
        animate(
          line,
          { scaleX: 1 },
          { type: "spring", stiffness: 2000, damping: 40 },
        ),
        animate(
          rightWing,
          { x: 0 },
          { type: "spring", stiffness: 2000, damping: 40 },
        ),
        animate(
          rightWing.children[0] as SVGPathElement,
          {
            d: "M20 15H23.5C25.9853 15 28 17.0147 28 19.5V19.5C28 21.9853 25.9853 24 23.5 24H20",
          },
          { type: "spring", stiffness: 2000, damping: 40 },
        ),
      ]);

      await sleep(400);

      if (!linkRef.current) return;

      await Promise.all([
        animate(
          linkRef.current,
          { color: "#2626267A" },
          { type: "spring", stiffness: 400, damping: 20 },
        ),
        animate(
          leftWing.children[0] as SVGPathElement,
          //@ts-ignore
          { d: oldLeftWingD },
          { type: "spring", stiffness: 400, damping: 20 },
        ),
        animate(
          rightWing.children[0] as SVGPathElement,
          //@ts-ignore
          { d: oldRightWingD },
          { type: "spring", stiffness: 400, damping: 20 },
        ),
      ]);
    };

    const triggerExplosionAnimation = () => {
      if (!explosionRef.current) return;

      let index = -1;

      const children = Array.from(explosionRef.current.children);
      const interval = setInterval(() => {
        index++;

        if (data[index] === undefined) {
          clearInterval(interval);

          return;
        }

        children.forEach((child) => {
          child.innerHTML = data[index];
        });

        if (index >= data.length) clearInterval(interval);
      }, 40);
    };

    let activeIndex = 0;

    const iconsChildren = Array.from(
      iconsRef.current.children,
    ) as HTMLElement[];

    const width = iconsChildren[0].clientWidth;

    return animateOnVisible({
      animation: animate(
        iconsRef.current,
        { y: 16 * -width },
        {
          duration: 50,
          ease: "linear",
          repeat: Infinity,
          onUpdate: (y) => {
            const newActiveIndex = Math.min(
              Math.floor((y + -width / 2) / -width),
              16,
            );

            if (newActiveIndex !== activeIndex) {
              iconsChildren.forEach((child, index) => {
                (child as HTMLElement).dataset.active =
                  index === newActiveIndex ? "true" : "false";
              });

              setTimeout(
                () => {
                  triggerIconAnimation();
                  setTimeout(() => {
                    triggerExplosionAnimation();
                  }, 500);
                },
                window.innerWidth < 996 ? 0 : 650,
              );
            }

            activeIndex = newActiveIndex;
          },
        },
      ),
      element: iconsRef.current,
    });
  }, []);

  return (
    <div className="lg:py-58 lg:px-80 overflow-clip developer-integrations z-[1] relative w-full grid grid-cols-2">
      <div className="inset-x-80 lg-max:hidden absolute inset-y-0 border-x border-border-faint" />
      <div className="inset-x-0 absolute inset-y-68 lg:inset-y-60 z-[0] border-y border-border-faint" />
      <div className="h-full cw-1 absolute top-0 bg-border-faint" />
      <div className="absolute w-[calc(50%-0.5px)] lg:w-192 left-0 lg:left-81 h-full bg-background-base" />

      <div
        className="grid grid-cols-2 gap-24 z-[11] absolute text-[10px]/[12px] whitespace-pre text-[#FA5D19] font-ascii cw-[1464px] h-[400px] pointer-events-none select-none fc-decoration"
        ref={explosionRef}
      >
        <div />

        <div />
      </div>

      <div>
        <div className="h-max relative z-[11]" ref={iconsRef}>
          {Array.from({ length: 24 }).map((_, i) => (
            <IconGroup data-active={i === 0} key={i}>
              <Image
                alt={`developer-${i + 1}`}
                height={56}
                src={`developer/${(i % 8) + 1}`}
                width={56}
              />
            </IconGroup>
          ))}

          <div className="h-1 bottom-0 left-0 w-full absolute bg-border-faint" />
        </div>
      </div>

      <div
        className="size-39 rounded-full center z-[11] bg-background-base before:inside-border before:border-border-faint text-[#262626]/48 flex-center"
        ref={linkRef}
      >
        <svg
          className="overlay"
          fill="none"
          height="39"
          viewBox="0 0 39 39"
          width="39"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16.5 15H15.5C13.0147 15 11 17.0147 11 19.5V19.5C11 21.9853 13.0147 24 15.5 24H16.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.25"
          />
        </svg>

        <svg
          className="overlay"
          fill="none"
          height="39"
          viewBox="0 0 39 39"
          width="39"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 19.5H23"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.25"
          />
        </svg>
        <svg
          className="overlay"
          fill="none"
          height="39"
          viewBox="0 0 39 39"
          width="39"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.5 15H23.5C25.9853 15 28 17.0147 28 19.5V19.5C28 21.9853 25.9853 24 23.5 24H22.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.25"
          />
        </svg>
      </div>

      <div className="lg-max:pt-66">
        <IconGroup innerCircleClassName="!bg-[#FDFDFD]" data-active>
          <div className="size-52" />
        </IconGroup>
      </div>
    </div>
  );
}

const IconGroup = ({
  children,
  innerCircleClassName,
  ...attrs
}: {
  children: React.ReactNode;
  innerCircleClassName?: string;
} & HTMLAttributes<HTMLDivElement>) => (
  <div
    {...attrs}
    className={cn(
      "flex gap-12 z-[101] relative aspect-square flex-center group",
      attrs.className,
    )}
  >
    <div className="h-1 bottom-0 left-0 w-full absolute bg-border-faint" />
    <div className="absolute inset-23 bg-background-base rounded-full" />
    <div className="size-116 lg:size-128 rounded-full relative before:inside-border before:border-border-faint flex-center">
      <div
        className={cn(
          "rounded-full flex-center group-data-[active=true]:bg-white-alpha-72 [.group:not([data-active=true])_&]:![box-shadow:none] transition-all relative size-96 duration-[400ms]",
          "[.group:not([data-active=true])_&]:scale-[0.9] [.group:not([data-active=true])_&]:opacity-10",
          innerCircleClassName,
        )}
        style={{
          boxShadow:
            "0px 24px 32px -12px rgba(0, 0, 0, 0.03), 0px 16px 24px -8px rgba(0, 0, 0, 0.03), 0px 8px 16px -4px rgba(0, 0, 0, 0.03), 0px 0px 0px 1px rgba(0, 0, 0, 0.03)",
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

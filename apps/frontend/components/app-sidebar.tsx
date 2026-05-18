'use client';

import * as React from 'react';
import Logomark from '@/public/images/Logomark.svg';
import {
  AudioWaveform,
  Bell,
  BookOpen,
  Bot,
  CircleQuestionMark,
  Command,
  Frame,
  GalleryVerticalEnd,
  ListTodo,
  Map,
  Newspaper,
  PieChart,
  Settings,
  Settings2,
  SquareTerminal,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// This is sample data.
const data = {
  navMain: [
    {
      title: 'Job Listing',
      url: '/recruiter/jobs',
      icon: ListTodo,
    },
    {
      title: 'News Feed',
      url: '/recruiter/news-feed',
      icon: Newspaper,
    },
    // {
    //   title: 'Models',
    //   url: '#',
    //   icon: Bot,
    //   items: [
    //     {
    //       title: 'Genesis',
    //       url: '#',
    //     },
    //     {
    //       title: 'Explorer',
    //       url: '#',
    //     },
    //     {
    //       title: 'Quantum',
    //       url: '#',
    //     },
    //   ],
    // },
  ],
  footerNavs: [
    {
      name: 'Notifications',
      url: '#',
      icon: Bell,
    },
    {
      name: 'Settings',
      url: '#',
      icon: Settings,
    },
    {
      name: 'Support',
      url: '#',
      icon: CircleQuestionMark,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, toggleSidebar } = useSidebar();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className=" gap-spacing-sm data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div
            className={cn('min-w-8', state === 'collapsed' && 'cursor-pointer')}
            onClick={() => {
              state === 'collapsed' && toggleSidebar();
            }}
          >
            <Image
              className={cn(
                'max-h-8 max-w-8',
                state === 'collapsed' && 'max-w-8',
              )}
              alt="Fav"
              src={Logomark}
              width={32}
              height={32}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 text-left ">
            <span className="truncate text-label-sm font-label-sm-strong! text-text-gray-primary">
              Recruit Local
            </span>
            <span className="truncate text-label-xs text-text-gray-tertiary">
              Free Plan
            </span>
          </div>
          <span className=" cursor-pointer" onClick={toggleSidebar}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.875 3.75V16.25"
                stroke="#364153"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.875 3.75H3.125C2.77982 3.75 2.5 4.02982 2.5 4.375V15.625C2.5 15.9702 2.77982 16.25 3.125 16.25H16.875C17.2202 16.25 17.5 15.9702 17.5 15.625V4.375C17.5 4.02982 17.2202 3.75 16.875 3.75Z"
                stroke="#364153"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className=" gap-spacing-2xl p-spacing-0 pb-spacing-sm">
        <NavProjects projects={data.footerNavs} />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

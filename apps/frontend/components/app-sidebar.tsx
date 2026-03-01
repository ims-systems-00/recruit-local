'use client';

import * as React from 'react';
import Fav from '@/public/images/rl-fav.svg';
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  ListTodo,
  Map,
  PieChart,
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
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Job Listing',
      url: '#',
      icon: ListTodo,
      isActive: true,
      items: [
        {
          title: 'Lists',
          url: '/recruiter/job/lists',
        },
        {
          title: 'Create',
          url: '/recruiter/job-lists/create',
        },
      ],
    },
    {
      title: 'Models',
      url: '#',
      icon: Bot,
      items: [
        {
          title: 'Genesis',
          url: '#',
        },
        {
          title: 'Explorer',
          url: '#',
        },
        {
          title: 'Quantum',
          url: '#',
        },
      ],
    },
    {
      title: 'Documentation',
      url: '#',
      icon: BookOpen,
      items: [
        {
          title: 'Introduction',
          url: '#',
        },
        {
          title: 'Get Started',
          url: '#',
        },
        {
          title: 'Tutorials',
          url: '#',
        },
        {
          title: 'Changelog',
          url: '#',
        },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2,
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Billing',
          url: '#',
        },
        {
          title: 'Limits',
          url: '#',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChart,
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map,
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
          className=" gap-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div
            className={cn(
              'min-w-11',
              state === 'collapsed' && 'cursor-pointer',
            )}
            onClick={() => {
              state === 'collapsed' && toggleSidebar();
            }}
          >
            <Image
              className={cn(
                'max-h-6 max-w-11',
                state === 'collapsed' && 'max-w-8',
              )}
              alt="Fav"
              src={Fav}
              width={44}
              height={24}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 text-left text-sm leading-tight  text-title">
            <span className="truncate font-medium">Recruit Local</span>
            <span className="truncate text-xs">Free Plan</span>
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
                d="M10.937 3.4375L16.5625 9.06296M10 6.87546L16.5625 13.438M10 11.2505L15.312 16.5625M10 3.4375V16.5625M4.0625 3.4375H15.9375C16.2827 3.4375 16.5625 3.71732 16.5625 4.0625V15.9375C16.5625 16.2827 16.2827 16.5625 15.9375 16.5625H4.0625C3.71732 16.5625 3.4375 16.2827 3.4375 15.9375V4.0625C3.4375 3.71732 3.71732 3.4375 4.0625 3.4375Z"
                stroke="#152536"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

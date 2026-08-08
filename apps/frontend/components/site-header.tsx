'use client';
import { useSidebar } from './ui/sidebar';
import { Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/services/user/user.client';
import { ACCOUNT_TYPE_ENUMS } from '@rl/types';
import { useLogout } from '@/services/auth/auth.client';

export default function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const router = useRouter();
  const { logout } = useLogout();
  return (
    <header className="sticky top-0 z-40 flex h-14 justify-between items-center border-b bg-bg-gray-soft-primary px-4 md:hidden">
      <span className=" cursor-pointer" onClick={toggleSidebar}>
        <Menu className="w-6 h-6" />
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className=" size-10 border border-border-gray-secondary cursor-pointer items-center justify-center">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.firstName?.charAt(0)} {user.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-40 bg-bg-gray-soft-primary"
          align="start"
        >
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                user?.type === ACCOUNT_TYPE_ENUMS.CANDIDATE &&
                  router.push(`/candidate/profile/${user?.jobProfileId}`);
                user?.type === ACCOUNT_TYPE_ENUMS.EMPLOYER &&
                  router.push(`/recruiter/profile/${user?.tenantId}`);
              }}
              className=" cursor-pointer"
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                user?.type === ACCOUNT_TYPE_ENUMS.CANDIDATE &&
                  router.push(
                    `/candidate/profile/${user?.jobProfileId}/verification`,
                  );
                user?.type === ACCOUNT_TYPE_ENUMS.EMPLOYER &&
                  router.push(
                    `/recruiter/profile/${user?.tenantId}/verification`,
                  );
              }}
              className=" cursor-pointer"
            >
              Verification center
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => logout()}
              className=" cursor-pointer"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

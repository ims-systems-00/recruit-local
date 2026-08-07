import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import SiteHeader from '@/components/site-header';

export default function RecruiterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className=" min-w-0">
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-spacing-4xl">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

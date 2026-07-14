import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function RecruiterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className=" min-w-0">
        <div className="flex flex-1 flex-col gap-spacing-4xl">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

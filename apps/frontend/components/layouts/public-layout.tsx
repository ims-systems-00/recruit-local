import React from 'react';
import MenuBar from '../menu-bar';
import Footer from '../footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <MenuBar />
      {children}
      <Footer />
    </div>
  );
}

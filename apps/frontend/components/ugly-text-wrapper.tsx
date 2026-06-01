'use client';

export default function UglyTextWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="text-body-md text-yellow-500">{children}</div>;
}

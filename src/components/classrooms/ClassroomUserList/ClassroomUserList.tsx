import React from 'react';

export default function ClassroomUserList({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ul className="px-4 flex-1 overflow-y-auto min-h-0">{children}</ul>;
}

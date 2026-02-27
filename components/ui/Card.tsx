import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={`bg-[#FFFBF5] border border-[#E7DCCB] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6 ${className ?? ''}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

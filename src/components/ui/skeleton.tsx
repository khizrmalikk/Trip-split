import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 bg-[length:200%_100%] bg-white/[0.07]',
        'animate-[shimmer_1.5s_ease-in-out_infinite]',
        className,
      )}
    />
  );
}

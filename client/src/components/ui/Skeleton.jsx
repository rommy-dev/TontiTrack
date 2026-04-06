// src/components/ui/Skeleton.jsx
import { cn } from '../../lib/utils.js';

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
        className
      )}
      {...props}
    />
  );
}

// Skeleton pour une carte cycle
export function SkeletonCycleCard() {
  return (
    <div className="bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-24 mb-3" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-2 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton pour la liste des membres
export function SkeletonMembersList() {
  return (
    <div className="bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-20 rounded" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton pour la liste des contributions
export function SkeletonContributionsList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1.5">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded" />
        </div>
      ))}
    </div>
  );
}

// Skeleton pour une carte contribution
export function SkeletonContributionCard() {
  return (
    <div className="bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl shadow-card p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Montants */}
      <div className="flex items-baseline justify-between text-sm">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-4 w-24" />
      </div>

      <Skeleton className="h-2 w-full rounded" />

      {/* Action */}
      <Skeleton className="h-8 w-full rounded" />
    </div>
  );
}

// Skeleton pour une carte groupe
export function SkeletonGroupCard() {
  return (
    <div className="bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl shadow-card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex justify-between text-xs">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
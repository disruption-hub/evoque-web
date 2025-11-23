'use client';

import { Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RecentActivity {
  type: string;
  message: string;
  timestamp: string;
}

interface RecentActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities?: RecentActivity[];
}

export function RecentActivityModal({
  isOpen,
  onClose,
  activities = [],
}: RecentActivityModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </DialogTitle>
          <DialogDescription>
            Latest updates and changes across the platform
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-4">
          {activities && activities.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-4">
                {activities.map((activity, idx) => (
                  <li key={idx}>
                    <div className="relative pb-4">
                      {idx !== activities.length - 1 && (
                        <span
                          className="absolute top-2 left-2 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-2">
                        <div className="flex min-w-0 flex-1 justify-between space-x-2 pt-0.5 flex-col sm:flex-row gap-1 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-black break-words">{activity.message}</p>
                          </div>
                          <div className="whitespace-nowrap text-left sm:text-right text-xs text-black/70 flex-shrink-0">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-8 text-center text-black/70">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


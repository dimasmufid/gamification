"use client";

import type { SessionTemplate } from "@/lib/models/session";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store/use-game-store";
import { Skeleton } from "@/components/ui/skeleton";

type TasksTabProps = {
  tasks: SessionTemplate[];
  loading?: boolean;
};

export function TasksTab({ tasks, loading }: TasksTabProps) {
  const setSelectedTaskId = useGameStore((state) => state.setSelectedTaskId);

  if (loading && !tasks.length) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/60">
        No task templates yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-2xl border border-white/5 bg-gradient-to-r from-white/5 to-white/0 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">{task.name}</p>
              <p className="text-xs uppercase tracking-wide text-white/50">
                {task.category} · {task.room.toUpperCase()}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedTaskId(task.id)}
              className="text-xs uppercase"
            >
              Select
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

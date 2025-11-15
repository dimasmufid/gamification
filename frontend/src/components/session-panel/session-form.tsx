"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGameStore } from "@/lib/store/use-game-store";
import { startSession } from "@/lib/api/endpoints";
import { toast } from "sonner"
import { phaserCommands } from "@/game/phaser/events";

const sessionSchema = z.object({
  taskTemplateId: z.string().min(1, "Select a task"),
  durationMinutes: z.enum(["25", "50", "90"]),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

const durations = [
  { value: "25", label: "25 min - Sprint" },
  { value: "50", label: "50 min - Deep Focus" },
  { value: "90", label: "90 min - Immersion" },
];

type SessionFormProps = {
  loading?: boolean;
};

export function SessionForm({ loading }: SessionFormProps) {
  const tasks = useGameStore((state) => state.tasks);
  const selectedTaskId = useGameStore((state) => state.selectedTaskId);
  const setSelectedTaskId = useGameStore((state) => state.setSelectedTaskId);
  const activeRoom = useGameStore((state) => state.activeRoom);
  const startSessionAction = useGameStore((state) => state.startSession);

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      taskTemplateId: selectedTaskId ?? "",
      durationMinutes: "50",
    },
  });

  const taskTemplateId = useWatch({
    control: form.control,
    name: "taskTemplateId",
  });
  const durationValue = useWatch({
    control: form.control,
    name: "durationMinutes",
  });

  useEffect(() => {
    if (selectedTaskId) {
      form.setValue("taskTemplateId", selectedTaskId);
    }
  }, [selectedTaskId, form]);

  const onSubmit = async (values: SessionFormValues) => {
    const template = tasks.find((task) => task.id === values.taskTemplateId);
    if (!template) {
      toast.error("Select a task first", {
      });
      return;
    }
    const duration = Number(values.durationMinutes);
    const canStart = template.room === activeRoom || template.room === "plaza";
    if (!canStart) {
      toast("Move to the correct room",{
        description: `This task requires the ${template.room} room.`,
      });
      return;
    }

    try {
      const session = await startSession({
        taskTemplateId: template.id,
        durationMinutes: duration,
        room: template.room,
      });
      startSessionAction(session);
      phaserCommands.emit("command:lockMovement");
    } catch (error) {
      toast.error("Unable to start session", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const selectedTemplate = tasks.find((task) => task.id === taskTemplateId);
  const requiresRoomMatch = selectedTemplate && selectedTemplate.room !== activeRoom;

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="task">Task Template</Label>
        <Select
          value={taskTemplateId}
          onValueChange={(value) => {
            setSelectedTaskId(value);
            form.setValue("taskTemplateId", value);
          }}
        >
          <SelectTrigger id="task">
            <SelectValue placeholder={loading ? "Loading…" : "Select a task"} />
          </SelectTrigger>
          <SelectContent>
            {tasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.name} · {task.room}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Duration</Label>
        <div className="grid gap-2">
          {durations.map((duration) => (
            <button
              key={duration.value}
              type="button"
              onClick={() => form.setValue("durationMinutes", duration.value)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                durationValue === duration.value
                  ? "border-white/40 bg-white/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {duration.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-white/60">
        {requiresRoomMatch
          ? `Move your avatar to the ${selectedTemplate?.room} room to begin this session.`
          : "Your avatar will be locked in place until the timer ends."}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedTemplate || requiresRoomMatch}
      >
        Start Session
      </Button>
    </form>
  );
}

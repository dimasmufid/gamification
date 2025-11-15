"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksTab } from "@/components/right-panel/tasks-tab";
import { InventoryTab } from "@/components/right-panel/inventory-tab";
import { HistoryTab } from "@/components/right-panel/history-tab";
import { useGameStore } from "@/lib/store/use-game-store";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useState } from "react";
import { PanelsTopLeft } from "lucide-react";

type RightPanelProps = {
  loading?: boolean;
};

export function RightPanel({ loading }: RightPanelProps) {
  const [tab, setTab] = useState("tasks");
  const inventory = useGameStore((state) => state.inventory);
  const tasks = useGameStore((state) => state.tasks);
  const isDesktop = useMediaQuery("(min-width: 1280px)");

  const content = (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="w-full">
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="tasks">
        <TasksTab tasks={tasks} loading={loading} />
      </TabsContent>
      <TabsContent value="inventory">
        <InventoryTab items={inventory} loading={loading} />
      </TabsContent>
      <TabsContent value="history">
        <HistoryTab />
      </TabsContent>
    </Tabs>
  );

  if (isDesktop) {
    return content;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <PanelsTopLeft className="h-4 w-4" />
          Panels
        </Button>
      </SheetTrigger>
      <SheetContent>{content}</SheetContent>
    </Sheet>
  );
}

"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const placeholderHistory = [
  {
    id: "1",
    task: "Deep Work",
    duration: 50,
    status: "success",
    xp: 100,
    gold: 50,
  },
];

export function HistoryTab() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>XP</TableHead>
          <TableHead>Gold</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {placeholderHistory.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{entry.task}</TableCell>
            <TableCell>{entry.duration} min</TableCell>
            <TableCell className="capitalize">{entry.status}</TableCell>
            <TableCell>+{entry.xp}</TableCell>
            <TableCell>+{entry.gold}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

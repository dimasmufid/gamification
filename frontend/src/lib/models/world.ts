export interface WorldState {
  id: string;
  userId: string;
  studyRoomLevel: 1 | 2;
  buildRoomLevel: 1 | 2;
  trainingRoomLevel: 1 | 2;
  totalSessionsSuccess: number;
  dayStreak: number;
  lastSessionDate: string | null;
}

export interface WorldDecorState {
  studyLevel: 1 | 2;
  buildLevel: 1 | 2;
  plazaUpgrade: boolean;
}

export function deriveDecorState(world: WorldState): WorldDecorState {
  return {
    studyLevel: world.studyRoomLevel,
    buildLevel: world.buildRoomLevel,
    plazaUpgrade: world.totalSessionsSuccess >= 30,
  };
}

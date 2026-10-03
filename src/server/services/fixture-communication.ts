import "server-only";
export type ThreadRow = {
  adaptation_id?: string | null;
  idea_id?: string | null;
  id: string;
  owner_id: string;
  need_id: string | null;
  innovation_id: string | null;
  context_key: string;
  user_read: number;
  staff_read: number;
  updated_at: Date;
};
export type MessageRow = {
  id: string;
  sequence: number;
  thread_id: string;
  author_id: string;
  author_role: "USER" | "STAFF";
  body: string;
  request_key: string;
  created_at: Date;
};
type Memory = {
  threads: ThreadRow[];
  messages: MessageRow[];
  sequence: number;
};
const root = globalThis as unknown as { miCommunication?: Memory };
export function communicationMemory() {
  return (root.miCommunication ??= { threads: [], messages: [], sequence: 0 });
}

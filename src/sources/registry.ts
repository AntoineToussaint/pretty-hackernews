import type { Source } from "./types";
import { hnSource } from "./hn";

/** All sources the reader knows about. Add a new source's object here. */
export const SOURCES: Source[] = [hnSource];

export const DEFAULT_SOURCE_ID = hnSource.id;

export function getSource(id: string | null | undefined): Source {
  return SOURCES.find((s) => s.id === id) ?? hnSource;
}

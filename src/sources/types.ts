import type { ComponentType } from "react";

/** A selectable feed within a source — rendered as a tab in the header. */
export type FeedDef = { id: string; label: string };

export type FeedViewProps = {
  feedId: string;
  onOpenItem: (id: string) => void;
};

export type ItemViewProps = {
  itemId: string;
  onBack: () => void;
};

/**
 * A content source plugged into the shared frame. Each source owns BOTH its
 * data adapter and its own presentation ("skin") — the frame only decides
 * which source, feed, and item are active and renders the source's components.
 * Adding a site means adding a folder under `sources/` that exports one of these.
 */
export type Source = {
  /** Stable id used in the URL hash, e.g. "hn". */
  id: string;
  /** Display name, e.g. "Hacker News". */
  name: string;
  /** Feeds this source offers (tabs in the header). */
  feeds: FeedDef[];
  /** Feed selected when none is specified. */
  defaultFeed: string;
  /** Placeholder for the header's open-by-link box; omit to hide the box. */
  searchPlaceholder?: string;
  /** Parse a pasted link or id into an item id this source can open. */
  parseItemId?: (input: string) => string | null;
  /** The source's own feed (list) skin. */
  FeedView: ComponentType<FeedViewProps>;
  /** The source's own item (detail) skin. */
  ItemView: ComponentType<ItemViewProps>;
  /** Optional login/account chip rendered in the header (e.g. HN login state). */
  AccountStatus?: ComponentType;
};

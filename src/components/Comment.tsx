import { useState } from "react";
import type { CommentNode } from "../lib/api";
import { timeAgo } from "../lib/format";

const DEPTH_HUES = [
  "#ff5c1a",
  "#ff2d8a",
  "#a855f7",
  "#3b82f6",
  "#10b981",
  "#eab308",
];

type Props = {
  node: CommentNode;
  depth: number;
};

export function Comment({ node, depth }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const hue = DEPTH_HUES[depth % DEPTH_HUES.length];
  const isDeleted = !node.author && !node.text;
  const replyCount = countDescendants(node);

  return (
    <div
      className={
        depth === 0
          ? "card p-4 sm:p-5"
          : "rounded-lg border border-[color:var(--color-border)]/60 bg-[color:var(--color-bg-elev)]/40 p-3"
      }
    >
      <div className="flex items-center gap-2 text-xs text-[color:var(--color-fg-muted)]">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="grid size-5 place-items-center rounded-md ring-1 ring-[color:var(--color-border)] transition hover:bg-[color:var(--color-bg)]"
          aria-label={collapsed ? "Expand thread" : "Collapse thread"}
        >
          <span className="font-mono text-[10px] leading-none">
            {collapsed ? "+" : "−"}
          </span>
        </button>
        <span className="font-medium text-[color:var(--color-fg)]">
          {node.author ?? "[deleted]"}
        </span>
        <span>·</span>
        <span>{timeAgo(node.created_at_i)}</span>
        {collapsed && replyCount > 0 && (
          <>
            <span>·</span>
            <span>
              {replyCount} {replyCount === 1 ? "reply" : "replies"} hidden
            </span>
          </>
        )}
      </div>

      {!collapsed && (
        <>
          {isDeleted ? (
            <p className="mt-2 text-sm italic text-[color:var(--color-fg-muted)]">
              [comment removed]
            </p>
          ) : (
            <div
              className="comment-body mt-2 text-[14.5px]"
              dangerouslySetInnerHTML={{ __html: node.text ?? "" }}
            />
          )}

          {node.children.length > 0 && (
            <div
              className="mt-3 space-y-2 border-l-2 pl-3 sm:pl-4"
              style={{ borderColor: `${hue}55` }}
            >
              {node.children.map((c) => (
                <Comment key={c.id} node={c} depth={depth + 1} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function countDescendants(node: CommentNode): number {
  let n = 0;
  for (const c of node.children) {
    n++;
    n += countDescendants(c);
  }
  return n;
}

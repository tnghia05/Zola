import type { Reaction } from '../../../api';

interface ReactionSummaryProps {
  reactions?: Reaction[];
}

export function ReactionSummary({ reactions }: ReactionSummaryProps) {
  if (!reactions || reactions.length === 0) return null;

  const grouped = reactions.reduce<Record<string, number>>((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="chat-reaction-summary">
      {Object.entries(grouped).map(([emoji, count]) => (
        <span key={emoji} className="chat-reaction-chip">
          {emoji} {count}
        </span>
      ))}
    </div>
  );
}

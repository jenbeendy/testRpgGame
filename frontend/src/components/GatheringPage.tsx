import { useState, useEffect } from 'react';
import { useGather, GatherResult } from '../hooks/useGathering';
import { useAuthStore } from '../store/auth';

const ITEM_NAMES: Record<number, string> = {
  1: 'Copper Ore', 2: 'Iron Ore', 3: 'Gold Ore',
  5: 'Wood Log', 7: 'Leather Scrap', 8: 'Fine Leather', 9: 'Coal',
  11: 'Water Essence', 12: 'Fire Essence', 13: 'Earth Essence', 14: 'Air Essence', 15: 'Crystal Shard',
  16: 'Pure Crystal', 17: 'String', 18: 'Rope', 19: 'Cloth',
};

const ZONES = [
  { id: 'mine', emoji: '⛏️', name: 'Mine', items: [1, 2, 3, 9, 15], gold: '8-18' },
  { id: 'forest', emoji: '🌲', name: 'Forest', items: [5, 7, 17, 18, 19], gold: '5-12' },
  { id: 'plains', emoji: '🌾', name: 'Plains', items: [7, 8, 13, 19], gold: '5-15' },
  { id: 'magic', emoji: '✨', name: 'Magic', items: [11, 12, 13, 14, 15, 16], gold: '15-30' },
];

export const GatheringPage = () => {
  const user = useAuthStore((s) => s.user);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [lastResult, setLastResult] = useState<GatherResult | null>(null);
  const gather = useGather(user?.id || null);

  if (!user?.id) {
    return <div className="text-gaming-cyan text-center py-12">⏳ Loading user data...</div>;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((zone) => {
          next[zone] = Math.max(0, next[zone] - 1);
          if (next[zone] === 0) delete next[zone];
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGather = async (zone: string) => {
    try {
      const result = await gather.mutateAsync(zone);
      setLastResult(result);
      if (result.seconds_remaining > 0) {
        setCooldowns((prev) => ({ ...prev, [zone]: result.seconds_remaining }));
      }
    } catch (e) {
      // Handle cooldown error - parse seconds_remaining from error or response
      console.error('Gather failed:', e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {ZONES.map((zone) => (
          <div key={zone.id} className="bg-slate-700 rounded-lg p-4 border border-purple-500/30">
            <div className="text-3xl mb-2">{zone.emoji}</div>
            <h3 className="text-lg font-bold mb-2">{zone.name}</h3>
            <div className="text-sm text-slate-300 mb-3">
              <div className="text-xs">Possible drops:</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {zone.items.map((id) => (
                  <span key={id} className="bg-slate-600 px-2 py-1 rounded text-xs">
                    {ITEM_NAMES[id] || `Item ${id}`}
                  </span>
                ))}
              </div>
              <div className="text-xs mt-2">Gold: {zone.gold}</div>
            </div>
            <button
              onClick={() => handleGather(zone.id)}
              disabled={!!cooldowns[zone.id] || gather.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:text-slate-400 text-white px-3 py-2 rounded transition"
            >
              {cooldowns[zone.id]
                ? `⏳ ${cooldowns[zone.id]}s`
                : gather.isPending
                  ? 'Gathering...'
                  : 'Gather'}
            </button>
          </div>
        ))}
      </div>

      {lastResult && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={() => setLastResult(null)}>
          <div className="bg-slate-800 rounded-lg p-6 max-w-md border border-purple-500/50">
            <h3 className="text-xl font-bold mb-4">Gathering Complete!</h3>
            <div className="space-y-2 mb-4">
              {lastResult.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{ITEM_NAMES[item.item_template_id] || `Item ${item.item_template_id}`}</span>
                  <span className="text-yellow-400">+{item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-slate-600 pt-2 flex justify-between text-sm font-bold">
                <span>Gold earned:</span>
                <span className="text-yellow-400">+{lastResult.gold_earned}</span>
              </div>
            </div>
            <button
              onClick={() => setLastResult(null)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

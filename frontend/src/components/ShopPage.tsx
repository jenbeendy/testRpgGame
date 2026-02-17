import { useState } from 'react';
import { useGold, useShopCatalog, useBuyItem } from '../hooks/useGathering';
import { useAuthStore } from '../store/auth';

export const ShopPage = () => {
  const user = useAuthStore((s) => s.user);
  const { data: gold = 0 } = useGold(user?.id || null);
  const { data: catalog = [] } = useShopCatalog();
  const buyItem = useBuyItem(user?.id || null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleBuy = async (itemId: number, itemName: string) => {
    const qty = quantities[itemId] || 1;
    try {
      await buyItem.mutateAsync({ itemId, qty });
      setSuccessMessage(`Purchased ${qty}x ${itemName}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setQuantities((prev) => ({ ...prev, [itemId]: 1 }));
    } catch (e) {
      console.error('Purchase failed:', e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-700 rounded-lg p-4 border border-yellow-500/30">
        <div className="text-sm text-slate-300">Gold Balance</div>
        <div className="text-3xl font-bold text-yellow-400">{gold} 💰</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {catalog.map((item) => {
          const qty = quantities[item.item_id] || 1;
          const totalCost = item.price * qty;
          const canAfford = gold >= totalCost;

          return (
            <div
              key={item.item_id}
              className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-purple-500/50 transition"
            >
              <h3 className="font-bold text-sm mb-2">{item.name}</h3>
              <div className="text-xs text-slate-400 mb-3">Price: {item.price} 💰</div>

              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() =>
                    setQuantities((prev) => ({
                      ...prev,
                      [item.item_id]: Math.max(1, (prev[item.item_id] || 1) - 1),
                    }))
                  }
                  className="bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded text-sm"
                >
                  -
                </button>
                <span className="flex-1 text-center text-sm">{qty}</span>
                <button
                  onClick={() =>
                    setQuantities((prev) => ({
                      ...prev,
                      [item.item_id]: Math.min(10, (prev[item.item_id] || 1) + 1),
                    }))
                  }
                  className="bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded text-sm"
                >
                  +
                </button>
              </div>

              <div className="text-xs text-slate-400 mb-3">Total: {totalCost} 💰</div>

              <button
                onClick={() => handleBuy(item.item_id, item.name)}
                disabled={!canAfford || buyItem.isPending}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 disabled:text-slate-400 text-white px-3 py-2 rounded text-sm transition"
              >
                {!canAfford ? 'Insufficient gold' : buyItem.isPending ? 'Buying...' : 'Buy'}
              </button>
            </div>
          );
        })}
      </div>

      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          ✓ {successMessage}
        </div>
      )}
    </div>
  );
};

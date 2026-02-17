import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface GatherItem {
  item_template_id: number;
  name: string;
  quantity: number;
}

export interface GatherResult {
  items: GatherItem[];
  gold_earned: number;
  seconds_remaining: number;
}

export interface ShopItem {
  item_id: number;
  name: string;
  price: number;
}

export interface BuyResult {
  gold_remaining: number;
  item_template_id: number;
  quantity: number;
}

export const useGather = (userId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (zone: string) => {
      if (!userId) throw new Error('User ID not available');
      const res = await fetch(`/api/gather/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone }),
      });
      if (!res.ok) throw new Error('Gather failed');
      return res.json() as Promise<GatherResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
      queryClient.invalidateQueries({ queryKey: ['gold', userId] });
    },
  });
};

export const useGold = (userId: number | null) => {
  return useQuery({
    queryKey: ['gold', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID not available');
      const res = await fetch(`/api/gold/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch gold');
      const data = await res.json();
      return data.gold as number;
    },
    enabled: !!userId,
  });
};

export const useShopCatalog = () => {
  return useQuery({
    queryKey: ['shop-catalog'],
    queryFn: async () => {
      const res = await fetch('/api/shop/catalog');
      if (!res.ok) throw new Error('Failed to fetch catalog');
      const data = await res.json();
      return data.catalog as ShopItem[];
    },
  });
};

export const useBuyItem = (userId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { itemId: number; qty: number }) => {
      if (!userId) throw new Error('User ID not available');
      const res = await fetch(`/api/shop/${userId}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_template_id: params.itemId,
          quantity: params.qty,
        }),
      });
      if (!res.ok) throw new Error('Purchase failed');
      return res.json() as Promise<BuyResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
      queryClient.invalidateQueries({ queryKey: ['gold', userId] });
    },
  });
};

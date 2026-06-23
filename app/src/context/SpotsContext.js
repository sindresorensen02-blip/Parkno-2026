import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SpotsContext = createContext(null);

export function SpotsProvider({ children }) {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSpots(data.map(normalise));
    }
    setLoading(false);
  };

  const addSpot = async (spot) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const typeMap = {
      innkjorsel: 'innkjorsel',
      garasje:    'garasje',
      utendors:   'utendors',
      innendors:  'innendors',
    };

    const { data, error } = await supabase
      .from('spots')
      .insert({
        owner_id:       user.id,
        title:          `${spot.typeLabel} · ${spot.area}`,
        address:        spot.address ?? spot.area,
        spot_type:      typeMap[spot.typeId] ?? 'utendors',
        price_per_hour: Number(spot.price),
        active:            true,
        moderation_status: 'pending',
        amenities:         spot.amenities ?? [],
        available_days: spot.days ?? ['Ma','Ti','On','To','Fr','Lø','Sø'],
        available_from: spot.fromTime ?? '08:00',
        available_to:   spot.toTime ?? '20:00',
        description:    spot.description ?? '',
      })
      .select()
      .single();

    if (!error && data) {
      setSpots(prev => [normalise(data), ...prev]);
    }
  };

  const updateSpot = async (id, changes) => {
    const dbChanges = {};
    if (changes.price  !== undefined) dbChanges.price_per_hour = Number(changes.price);
    if (changes.active !== undefined) dbChanges.active = changes.active;

    const { error } = await supabase
      .from('spots')
      .update(dbChanges)
      .eq('id', id);

    if (!error) {
      setSpots(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
    }
  };

  const deleteSpot = async (id) => {
    const { error } = await supabase
      .from('spots')
      .delete()
      .eq('id', id);

    if (!error) {
      setSpots(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <SpotsContext.Provider value={{ spots, loading, fetchSpots, addSpot, updateSpot, deleteSpot }}>
      {children}
    </SpotsContext.Provider>
  );
}

export function useSpots() {
  return useContext(SpotsContext);
}

function normalise(row) {
  const mod = row.moderation_status ?? 'approved';
  const sub = mod === 'pending'  ? 'Venter godkjenning'
            : mod === 'rejected' ? 'Avvist av Parkno'
            : row.active         ? 'Aktiv'
            :                      'Pause · gjenoppta';
  return {
    id:                row.id,
    title:             row.title,
    sub,
    price:             String(Math.round(row.price_per_hour)),
    active:            row.active,
    moderation_status: mod,
  };
}

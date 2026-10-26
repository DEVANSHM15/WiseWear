import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { isFirebaseConfigured, onAuthChange } from '@/services/firebase';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { useWardrobeStore } from '@/store/wardrobeStore';

export default function RootLayout() {
  const initializeWardrobe = useWardrobeStore((state) => state.initializeWardrobe);
  const fetchClothingItems = useWardrobeStore((state) => state.fetchClothingItems);

  useEffect(() => {
    // 1. Initialize local cache and check session
    initializeWardrobe();

    // 2. Listen to Firebase auth state changes if configured
    if (isFirebaseConfigured) {
      const unsubscribeFirebase = onAuthChange((user) => {
        if (user) {
          fetchClothingItems();
        }
      });
      return () => {
        unsubscribeFirebase();
      };
    }

    // 3. Listen to Supabase auth state changes if configured
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchClothingItems();
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [initializeWardrobe, fetchClothingItems]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

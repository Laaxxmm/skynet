
import { supabase } from '../lib/supabase';
import { Agreement, ExtractionResult } from '../types';

export const saveAgreement = async (agreement: ExtractionResult | Agreement) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.warn("User not authenticated. Skipping database save.");
        return null;
    }

    const { data, error } = await supabase
        .from('agreements')
        .insert([
            {
                user_id: user.id,
                ...agreement,
                created_at: new Date().toISOString(),
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error saving agreement:', error);
        // Don't throw, just log. We don't want to break the UI if DB fails.
        return null;
    }

    return data;
};

export const getAgreements = async () => {
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching agreements:', error);
        return [];
    }

    return data;
};

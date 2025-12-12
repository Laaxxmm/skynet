
import { supabase } from '../lib/supabase';
import { Agreement, ExtractionResult } from '../types';

export const saveAgreement = async (agreement: ExtractionResult | Agreement) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.warn("User not authenticated. Skipping database save.");
        return null;
    }

    // Sanitize data: PostgreSQL date columns fail on empty strings. Convert to null.
    // Also remove 'id' to let the database generate a valid UUID v4
    const { id, ...rest } = agreement;

    const sanitizedAgreement = {
        ...rest,
        startDate: agreement.startDate || null,
        renewalDate: agreement.renewalDate || null,
        expiryDate: agreement.expiryDate || null,
    };

    const { data, error } = await supabase
        .from('agreements')
        .insert([
            {
                user_id: user.id,
                ...sanitizedAgreement,
                created_at: new Date().toISOString(),
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error saving agreement:', error);
        return { data: null, error };
    }

    return { data, error: null };
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

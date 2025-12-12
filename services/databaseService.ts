
import { supabase } from '../lib/supabase';
import { Agreement, ExtractionResult } from '../types';

export const saveAgreement = async (agreement: ExtractionResult | Agreement) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.warn("User not authenticated. Skipping database save.");
        return null;
    }

    // Sanitize data: PostgreSQL date columns fail on empty strings or "null" strings.
    // Also remove 'id' to let the database generate a valid UUID v4
    const { id, ...rest } = agreement;

    const sanitizeDate = (val: string | null | undefined) => {
        if (!val) return null;
        if (typeof val === 'string' && (val.trim() === '' || val.toLowerCase() === 'null')) return null;
        return val;
    };

    const sanitizedAgreement = {
        ...rest,
        startDate: sanitizeDate(agreement.startDate),
        renewalDate: sanitizeDate(agreement.renewalDate),
        expiryDate: sanitizeDate(agreement.expiryDate),
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
        console.error('Error saving agreement: Operation failed.');
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
        console.error('Error fetching agreements: Operation failed.');
        return [];
    }

    return data;
};

export const deleteAgreement = async (id: string) => {
    const { error } = await supabase
        .from('agreements')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting agreement: Operation failed.');
        return { error };
    }

    return { error: null };
};

export const deleteAllAgreements = async () => {
    const { error } = await supabase
        .from('agreements')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows where ID is not nil (effectively all)

    if (error) {
        console.error('Error resetting database:', error);
        return { error };
    }

    return { error: null };
};

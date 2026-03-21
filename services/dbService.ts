import { supabase, isSupabaseConfigured } from '../supabaseClient';

export const syncColumnToSupabase = async (userId: string, column: string, data: any) => {
  if (!isSupabaseConfigured || !userId || userId === 'guest') return;
  
  try {
    const { error } = await supabase
      .from('user_app_data')
      .upsert({
        user_id: userId,
        [column]: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
    if (error) throw error;
  } catch (err) {
    console.error(`Error syncing ${column} to Supabase:`, err);
  }
};

export const fetchAllDataFromSupabase = async (userId: string) => {
  if (!isSupabaseConfigured || !userId || userId === 'guest') return null;
  
  try {
    const { data, error } = await supabase
      .from('user_app_data')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  } catch (err) {
    console.error('Error fetching from Supabase:', err);
    return null;
  }
};

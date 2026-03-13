import { supabase } from './supabase';

export type LogCategory = 'AUTH' | 'CHAT' | 'GROUP' | 'USER' | 'TEAM' | 'SYSTEM';

export async function logAction(
  action: string,
  category: LogCategory,
  details: string,
  userId: string,
  username: string
) {
  try {
    const { error } = await supabase.from('system_logs').insert([
      {
        action,
        category,
        details,
        user_id: userId,
        username
      }
    ]);
    if (error) console.error('Error logging action:', error);
  } catch (err) {
    console.error('Failed to log action:', err);
  }
}

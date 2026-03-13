import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qwlzuothshckldaxlqqz.supabase.co';
const supabaseKey = 'sb_publishable_ZZ2HDQCN4Y8O-q_qALY3Eg_Iidzfs1-';

export const supabase = createClient(supabaseUrl, supabaseKey);

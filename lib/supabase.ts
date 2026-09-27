import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tkbqnssxdfmdrqiastrj.supabase.co'
const supabaseKey = 'sb_publishable_Z6Bwn2w0rOE_nuGZrjDTKA_Bev3tqCI'

export const supabase = createClient(supabaseUrl, supabaseKey)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvqcpgfyvghalugowflc.supabase.co'
const supabaseKey = 'sb_publishable_BHeGiq1A40zQexsIcSe3FQ_rtQZsPCV'

export const supabase = createClient(supabaseUrl, supabaseKey)
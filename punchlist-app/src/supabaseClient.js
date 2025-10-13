import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gairdxaanqxibhyyvudr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhaXJkeGFhbnF4aWJoeXl2dWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzY4NDMsImV4cCI6MjA3NTk1Mjg0M30.jD_0tPiWsHv_jnPqRtpBpwHu3YHquNPPE8QdkmB0g4U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
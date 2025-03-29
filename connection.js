// supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL; // Assurez-vous d'avoir défini cela dans votre .env
const supabaseKey = process.env.SUPABASE_KEY; // Assurez-vous d'avoir défini cela dans votre .env
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
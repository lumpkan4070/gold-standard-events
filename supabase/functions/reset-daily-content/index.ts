import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting daily reset process...');

    // Calculate cutoff time (6 hours ago)
    const cutoffTime = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    // Delete old song requests (older than 6 hours)
    const { data: deletedRequests, error: deleteRequestsError } = await supabaseClient
      .from('song_requests')
      .delete()
      .lt('created_at', cutoffTime.toISOString());

    if (deleteRequestsError) {
      console.error('Error deleting old song requests:', deleteRequestsError);
    } else {
      console.log('Deleted old song requests');
    }

    // Delete old song votes (older than 6 hours)
    const { data: deletedVotes, error: deleteVotesError } = await supabaseClient
      .from('song_votes')
      .delete()
      .lt('created_at', cutoffTime.toISOString());

    if (deleteVotesError) {
      console.error('Error deleting old song votes:', deleteVotesError);
    } else {
      console.log('Deleted old song votes');
    }

    // Delete old DJ ratings (older than 24 hours for ratings)
    const ratingCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: deletedRatings, error: deleteRatingsError } = await supabaseClient
      .from('dj_ratings')
      .delete()
      .lt('created_at', ratingCutoff.toISOString())
      .eq('performance_date', new Date().toISOString().split('T')[0]);

    if (deleteRatingsError) {
      console.error('Error deleting old DJ ratings:', deleteRatingsError);
    } else {
      console.log('Deleted old DJ ratings for today');
    }

    console.log('Daily reset completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Daily reset completed successfully',
      cutoffTime: cutoffTime.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in daily reset:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
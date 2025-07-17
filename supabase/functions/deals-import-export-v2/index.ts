import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface matching actual database schema - COMPLETE FIELD SET
interface Deal {
  id?: string;
  deal_name: string;
  amount?: number;
  closing_date?: string;
  stage?: string;
  probability?: number;
  description?: string;
  currency?: string;
  
  // Discussion/Need stage
  customer_need_identified?: boolean;
  need_summary?: string;
  decision_maker_present?: boolean;
  customer_agreed_on_need?: string;
  
  // Qualified stage
  nda_signed?: boolean;
  budget_confirmed?: string;
  supplier_portal_access?: string;
  expected_deal_timeline_start?: string;
  expected_deal_timeline_end?: string;
  budget_holder?: string;
  decision_makers?: string;
  timeline?: string;
  
  // RFQ stage
  rfq_value?: number;
  rfq_document_url?: string;
  product_service_scope?: string;
  rfq_confirmation_note?: string;
  
  // Offered stage
  proposal_sent_date?: string;
  negotiation_status?: string;
  decision_expected_date?: string;
  negotiation_notes?: string;
  
  // Final stages
  win_reason?: string;
  loss_reason?: string;
  drop_reason?: string;
  
  // Execution
  supplier_portal_required?: boolean;
  execution_started?: boolean;
  begin_execution_date?: string;
  
  // General
  internal_notes?: string;
  related_lead_id?: string;
  related_meeting_id?: string;
  created_by?: string;
  modified_by?: string;
  created_at?: string;
  modified_at?: string;
  
  // Lead-related fields (from joined leads table)
  company_name?: string;
  lead_name?: string;
  lead_owner?: string;
  phone_no?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const timestamp = Date.now();
  console.log(`[${timestamp}] deals-import-export-v2 function called`);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, data } = await req.json();
    console.log('Action:', action, 'Data keys:', Object.keys(data || {}));
    
    if (action === 'export') {
      console.log('Exporting all deals with lead information...');
      
      // First get all deals
      const { data: deals, error } = await supabaseClient
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Export error:', error);
        throw error;
      }

      // Enrich deals with lead information
      const enrichedDeals = [];
      for (const deal of deals || []) {
        let enrichedDeal = { ...deal };
        
        if (deal.related_lead_id) {
          // Get lead information
          const { data: leadData, error: leadError } = await supabaseClient
            .from('leads')
            .select('lead_name, company_name, phone_no, contact_owner')
            .eq('id', deal.related_lead_id)
            .single();

          if (!leadError && leadData) {
            enrichedDeal.company_name = leadData.company_name;
            enrichedDeal.lead_name = leadData.lead_name;
            enrichedDeal.phone_no = leadData.phone_no;

            // Get lead owner profile
            if (leadData.contact_owner) {
              const { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('full_name, "Email ID"')
                .eq('id', leadData.contact_owner)
                .single();

              if (!profileError && profile) {
                let lead_owner = '';
                if (profile.full_name && profile.full_name !== profile["Email ID"]) {
                  lead_owner = profile.full_name;
                } else if (profile["Email ID"]) {
                  // Extract name from email (part before @)
                  lead_owner = profile["Email ID"].split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
                enrichedDeal.lead_owner = lead_owner;
              }
            }
          }
        }
        
        enrichedDeals.push(enrichedDeal);
      }

      console.log(`Successfully exported ${enrichedDeals?.length || 0} deals with lead information`);
      
      // Return enriched deals with EXACT field names for perfect import compatibility
      return new Response(JSON.stringify({ 
        success: true, 
        data: enrichedDeals || [],
        count: enrichedDeals?.length || 0,
        // Include ALL database fields plus lead fields for perfect roundtrip compatibility
        fields: [
          'id', 'deal_name', 'company_name', 'lead_name', 'lead_owner', 'phone_no',
          'amount', 'closing_date', 'stage', 'probability', 'description', 'currency',
          'customer_need_identified', 'need_summary', 'decision_maker_present', 'customer_agreed_on_need',
          'nda_signed', 'budget_confirmed', 'supplier_portal_access', 'expected_deal_timeline_start',
          'expected_deal_timeline_end', 'budget_holder', 'decision_makers', 'timeline',
          'rfq_value', 'rfq_document_url', 'product_service_scope', 'rfq_confirmation_note',
          'proposal_sent_date', 'negotiation_status', 'decision_expected_date', 'negotiation_notes',
          'win_reason', 'loss_reason', 'drop_reason', 'supplier_portal_required', 'execution_started', 
          'begin_execution_date', 'internal_notes', 'related_lead_id', 'related_meeting_id',
          'created_by', 'modified_by', 'created_at', 'modified_at'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'import') {
      const { deals: importDeals, userId } = data;
      
      console.log(`Processing import for ${importDeals?.length || 0} deals for user ${userId}`);
      
      if (!Array.isArray(importDeals) || importDeals.length === 0) {
        throw new Error('No valid deals data provided for import');
      }

      const results = {
        created: 0,
        updated: 0,
        errors: [] as string[]
      };

      console.log(`Starting import of ${importDeals.length} deals`);

      // Process deals one by one to avoid race conditions
      for (const dealData of importDeals) {
        try {
          console.log(`Processing deal: "${dealData.deal_name}" with ID: ${dealData.id || 'new'}`);
          
          // Validate required fields
          if (!dealData.deal_name?.trim()) {
            const error = 'Missing or empty deal_name';
            console.error(error);
            results.errors.push(error);
            continue;
          }

          // Clean and validate stage
          const validStages = ['Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'];
          const stage = dealData.stage?.trim() || 'Discussions';
          if (!validStages.includes(stage)) {
            console.log(`Invalid stage "${dealData.stage}" for deal "${dealData.deal_name}", using Discussions`);
            dealData.stage = 'Discussions';
          } else {
            dealData.stage = stage;
          }
          
          console.log(`Deal stage: ${dealData.stage}`);

          // Clean the data - ALL VALID DATABASE FIELDS
          const cleanDealData: Partial<Deal> = {
            deal_name: dealData.deal_name.trim(),
            stage: dealData.stage,
            description: dealData.description?.trim() || null,
            currency: dealData.currency?.trim() || 'USD',
          };

          // Handle numeric fields
          if (dealData.amount !== undefined && dealData.amount !== null && dealData.amount !== '') {
            const amount = typeof dealData.amount === 'string' 
              ? parseFloat(dealData.amount.replace(/[$,]/g, ''))
              : dealData.amount;
            cleanDealData.amount = isNaN(amount) ? null : amount;
          }

          if (dealData.probability !== undefined && dealData.probability !== null && dealData.probability !== '') {
            const prob = typeof dealData.probability === 'string' 
              ? parseFloat(dealData.probability)
              : dealData.probability;
            cleanDealData.probability = isNaN(prob) ? null : Math.max(0, Math.min(100, prob));
          }

          if (dealData.rfq_value !== undefined && dealData.rfq_value !== null && dealData.rfq_value !== '') {
            const rfqVal = typeof dealData.rfq_value === 'string' 
              ? parseFloat(dealData.rfq_value.replace(/[$,]/g, ''))
              : dealData.rfq_value;
            cleanDealData.rfq_value = isNaN(rfqVal) ? null : rfqVal;
          }

          // Handle boolean fields - COMPLETE LIST
          const booleanFields = ['customer_need_identified', 'decision_maker_present', 'nda_signed', 'supplier_portal_required', 'execution_started'];
          booleanFields.forEach(field => {
            if (dealData[field] !== undefined && dealData[field] !== null) {
              if (typeof dealData[field] === 'boolean') {
                cleanDealData[field] = dealData[field];
              } else {
                cleanDealData[field] = ['true', '1', 'yes', 'on'].includes(String(dealData[field]).toLowerCase().trim());
              }
            }
          });

          // Handle date fields - COMPLETE LIST
          const dateFields = ['closing_date', 'expected_deal_timeline_start', 'expected_deal_timeline_end', 'proposal_sent_date', 'decision_expected_date', 'begin_execution_date'];
          dateFields.forEach(field => {
            if (dealData[field]) {
              const date = new Date(dealData[field]);
              cleanDealData[field] = isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
            }
          });

          // Handle text fields - COMPLETE LIST
          const textFields = [
            'need_summary', 'customer_agreed_on_need', 'budget_confirmed', 'supplier_portal_access', 
            'budget_holder', 'decision_makers', 'timeline', 'rfq_document_url', 'product_service_scope', 
            'rfq_confirmation_note', 'negotiation_status', 'negotiation_notes', 'win_reason', 
            'loss_reason', 'drop_reason', 'internal_notes'
          ];
          textFields.forEach(field => {
            if (dealData[field] !== undefined && dealData[field] !== null) {
              cleanDealData[field] = String(dealData[field]).trim() || null;
            }
          });

          // Handle UUID fields
          const uuidFields = ['related_lead_id', 'related_meeting_id'];
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          uuidFields.forEach(field => {
            if (dealData[field]) {
              cleanDealData[field] = uuidRegex.test(dealData[field]) ? dealData[field] : null;
            }
          });

          const now = new Date().toISOString();
          let existingDeal = null;
          
          // EXACT DUPLICATE DETECTION: Check by ID first if provided, then by name
          if (dealData.id && dealData.id.trim()) {
            console.log(`Checking for existing deal by ID: ${dealData.id}`);
            const { data: idCheckData, error: idCheckError } = await supabaseClient
              .from('deals')
              .select('id, deal_name, stage')
              .eq('id', dealData.id.trim())
              .maybeSingle();
            
            if (idCheckError) {
              console.error('Error checking by ID:', idCheckError);
            } else if (idCheckData) {
              existingDeal = idCheckData;
              console.log(`Found existing deal by ID: ${idCheckData.deal_name} (ID: ${idCheckData.id})`);
            }
          }
          
          // Only check by name if no ID match found - PREVENT FALSE DUPLICATES
          if (!existingDeal) {
            console.log(`Checking for existing deal by name: "${cleanDealData.deal_name}"`);
            const { data: nameCheckData, error: nameCheckError } = await supabaseClient
              .from('deals')
              .select('id, deal_name, stage, created_at')
              .eq('deal_name', cleanDealData.deal_name.trim())
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (nameCheckError) {
              console.error('Error checking for duplicate by name:', nameCheckError);
            } else if (nameCheckData) {
              existingDeal = nameCheckData;
              console.log(`Found existing deal by name: ${nameCheckData.deal_name} (ID: ${nameCheckData.id}, Stage: ${nameCheckData.stage})`);
            }
          }

          // Handle lead information - create or find appropriate lead
          let finalLeadId = cleanDealData.related_lead_id;
          
          if (dealData.company_name?.trim() || dealData.lead_name?.trim() || dealData.phone_no?.trim()) {
            console.log(`Processing lead information for deal: ${cleanDealData.deal_name}`);
            
            // Check if we need to create a new lead or find existing one that matches the data
            let matchingLead = null;
            
            if (dealData.lead_name?.trim()) {
              // Look for existing lead with matching name and company
              const { data: existingLeads, error: leadSearchError } = await supabaseClient
                .from('leads')
                .select('id, lead_name, company_name, phone_no')
                .eq('lead_name', dealData.lead_name.trim())
                .eq('company_name', dealData.company_name?.trim() || '');
              
              if (!leadSearchError && existingLeads && existingLeads.length > 0) {
                // Find the best match
                for (const lead of existingLeads) {
                  if ((!dealData.phone_no || lead.phone_no === dealData.phone_no?.trim()) &&
                      (!dealData.company_name || lead.company_name === dealData.company_name?.trim())) {
                    matchingLead = lead;
                    break;
                  }
                }
              }
            }
            
            if (matchingLead) {
              // Use existing matching lead but update with new lead owner if provided
              finalLeadId = matchingLead.id;
              console.log(`Found matching lead: ${matchingLead.lead_name} (ID: ${matchingLead.id})`);
              
              // Update existing lead with new lead owner if provided in import
              if (dealData.lead_owner?.trim()) {
                console.log(`Updating existing lead with new owner: ${dealData.lead_owner}`);
                
                // Find contact_owner ID from lead_owner name
                let contactOwnerId = null;
                const { data: ownerProfiles, error: ownerSearchError } = await supabaseClient
                  .from('profiles')
                  .select('id, full_name, "Email ID"')
                  .or(`full_name.ilike.%${dealData.lead_owner.trim()}%,"Email ID".ilike.%${dealData.lead_owner.trim()}%`);
                
                if (!ownerSearchError && ownerProfiles && ownerProfiles.length > 0) {
                  const exactMatch = ownerProfiles.find(p => 
                    p.full_name?.toLowerCase() === dealData.lead_owner.trim().toLowerCase() ||
                    p["Email ID"]?.toLowerCase() === dealData.lead_owner.trim().toLowerCase()
                  );
                  
                  contactOwnerId = exactMatch ? exactMatch.id : ownerProfiles[0].id;
                  
                  // Update the existing lead
                  const { error: leadUpdateError } = await supabaseClient
                    .from('leads')
                    .update({ 
                      contact_owner: contactOwnerId,
                      modified_time: now,
                      modified_by: userId
                    })
                    .eq('id', matchingLead.id);
                  
                  if (leadUpdateError) {
                    console.error('Error updating lead owner:', leadUpdateError);
                  } else {
                    console.log(`Updated lead owner for: ${matchingLead.lead_name}`);
                  }
                }
              }
            } else if (dealData.lead_name?.trim()) {
              // Create new lead with the provided information
              console.log(`Creating new lead for deal: ${cleanDealData.deal_name}`);
              
              // Find contact_owner ID from lead_owner name if provided
              let contactOwnerId = null;
              if (dealData.lead_owner?.trim()) {
                console.log(`Looking for user with name: ${dealData.lead_owner}`);
                
                // Search for user by full_name or email
                const { data: ownerProfiles, error: ownerSearchError } = await supabaseClient
                  .from('profiles')
                  .select('id, full_name, "Email ID"')
                  .or(`full_name.ilike.%${dealData.lead_owner.trim()}%,"Email ID".ilike.%${dealData.lead_owner.trim()}%`);
                
                if (!ownerSearchError && ownerProfiles && ownerProfiles.length > 0) {
                  // Find exact match or best match
                  const exactMatch = ownerProfiles.find(p => 
                    p.full_name?.toLowerCase() === dealData.lead_owner.trim().toLowerCase() ||
                    p["Email ID"]?.toLowerCase() === dealData.lead_owner.trim().toLowerCase()
                  );
                  
                  if (exactMatch) {
                    contactOwnerId = exactMatch.id;
                    console.log(`Found exact match for lead owner: ${exactMatch.full_name || exactMatch["Email ID"]} (ID: ${exactMatch.id})`);
                  } else {
                    // Use first partial match
                    contactOwnerId = ownerProfiles[0].id;
                    console.log(`Found partial match for lead owner: ${ownerProfiles[0].full_name || ownerProfiles[0]["Email ID"]} (ID: ${ownerProfiles[0].id})`);
                  }
                }
              }
              
              const newLeadData = {
                lead_name: dealData.lead_name.trim(),
                company_name: dealData.company_name?.trim() || null,
                phone_no: dealData.phone_no?.trim() || null,
                contact_owner: contactOwnerId,
                created_time: now,
                created_by: userId,
                modified_time: now,
                modified_by: userId,
              };
              
              const { data: newLead, error: leadCreateError } = await supabaseClient
                .from('leads')
                .insert(newLeadData)
                .select('id')
                .single();
              
              if (leadCreateError) {
                console.error('Lead creation error:', leadCreateError);
                // Continue without lead link
              } else if (newLead) {
                finalLeadId = newLead.id;
                console.log(`Created new lead: ${dealData.lead_name} (ID: ${newLead.id}) with owner: ${dealData.lead_owner || 'None'}`);
              }
            }
          }
          
          // Update cleanDealData with the final lead ID
          if (finalLeadId) {
            cleanDealData.related_lead_id = finalLeadId;
          }

          if (existingDeal) {
            // Update existing deal
            console.log(`Updating existing deal: ${cleanDealData.deal_name} (ID: ${existingDeal.id})`);
            
            const updateData = {
              ...cleanDealData,
              modified_at: now,
              modified_by: userId,
            };
            
            const { error } = await supabaseClient
              .from('deals')
              .update(updateData)
              .eq('id', existingDeal.id);

            if (error) {
              console.error('Update error:', error);
              throw error;
            }
            
            console.log(`Successfully updated deal: ${cleanDealData.deal_name}`);
            results.updated++;
          } else {
            // Create new deal
            console.log(`Creating new deal: ${cleanDealData.deal_name}`);
            
            const insertData = {
              ...cleanDealData,
              // PRESERVE EXACT IDs for perfect export/import roundtrip
              ...(dealData.id && dealData.id.trim() ? { id: dealData.id.trim() } : {}),
              // Preserve timestamps if provided (for exact roundtrip)
              created_at: dealData.created_at || now,
              created_by: dealData.created_by || userId,
              modified_at: dealData.modified_at || now,
              modified_by: dealData.modified_by || userId,
            };
            
            const { error } = await supabaseClient
              .from('deals')
              .insert(insertData);

            if (error) {
              console.error('Insert error:', error);
              throw error;
            }
            
            console.log(`Successfully created deal: ${cleanDealData.deal_name}`);
            results.created++;
          }

        } catch (error: any) {
          const errorMsg = `Deal "${dealData.deal_name || 'Unknown'}": ${error.message}`;
          console.error('Error processing deal:', errorMsg);
          results.errors.push(errorMsg);
        }
      }

      console.log(`Import completed: Created ${results.created}, Updated ${results.updated}, Errors ${results.errors.length}`);
      
      if (results.errors.length > 0) {
        console.log('Import errors:', results.errors);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "import" or "export".' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in deals-import-export-v2 function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

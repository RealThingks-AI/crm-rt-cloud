import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConvertTimezoneRequest {
  localDateTime: string; // Format: "2025-08-29 18:00"
  timezone: string; // Format: "UTC+05:30"
  duration: number; // minutes
  operation: 'toUTC' | 'fromUTC';
}

interface ConvertTimezoneResponse {
  success: boolean;
  utcStart?: string;
  utcEnd?: string;
  localStart?: string;
  localEnd?: string;
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Timezone conversion function called:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { localDateTime, timezone, duration, operation }: ConvertTimezoneRequest = await req.json();

    console.log('🔍 Timezone Conversion Input:', {
      localDateTime,
      timezone,
      duration,
      operation
    });

    // Parse timezone offset (e.g., "UTC+05:30" -> +330 minutes)
    const parseTimezoneOffset = (tz: string): number => {
      const match = tz.match(/UTC([+-])(\d{1,2}):(\d{2})/);
      if (!match) throw new Error(`Invalid timezone format: ${tz}`);
      
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2]);
      const minutes = parseInt(match[3]);
      return sign * (hours * 60 + minutes);
    };

    const offsetMinutes = parseTimezoneOffset(timezone);

    if (operation === 'toUTC') {
      // Convert local time to UTC
      const localDate = new Date(localDateTime);
      
      if (isNaN(localDate.getTime())) {
        throw new Error('Invalid local datetime format');
      }

      // Subtract the timezone offset to get UTC
      const utcStart = new Date(localDate.getTime() - (offsetMinutes * 60000));
      const utcEnd = new Date(utcStart.getTime() + (duration * 60000));

      console.log('🔍 Local to UTC Conversion:', {
        input: {
          localDateTime,
          timezone,
          offsetMinutes
        },
        conversion: {
          localAsDate: localDate.toISOString(),
          utcStart: utcStart.toISOString(),
          utcEnd: utcEnd.toISOString()
        },
        note: 'These UTC values will be stored in Supabase'
      });

      return new Response(JSON.stringify({
        success: true,
        utcStart: utcStart.toISOString(),
        utcEnd: utcEnd.toISOString(),
      } as ConvertTimezoneResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } else if (operation === 'fromUTC') {
      // Convert UTC time to local time
      const utcDate = new Date(localDateTime); // localDateTime is actually UTC here
      
      if (isNaN(utcDate.getTime())) {
        throw new Error('Invalid UTC datetime format');
      }

      // Add the timezone offset to get local time
      const localStart = new Date(utcDate.getTime() + (offsetMinutes * 60000));
      const localEnd = new Date(localStart.getTime() + (duration * 60000));

      console.log('🔍 UTC to Local Conversion:', {
        input: {
          utcDateTime: localDateTime,
          timezone,
          offsetMinutes
        },
        conversion: {
          utcAsDate: utcDate.toISOString(),
          localStart: localStart.toISOString(),
          localEnd: localEnd.toISOString()
        },
        note: 'These local values will be displayed in UI'
      });

      return new Response(JSON.stringify({
        success: true,
        localStart: localStart.toISOString(),
        localEnd: localEnd.toISOString(),
      } as ConvertTimezoneResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    throw new Error('Invalid operation. Must be "toUTC" or "fromUTC"');

  } catch (error: any) {
    console.error('Error in convert-timezone function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error'
    } as ConvertTimezoneResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
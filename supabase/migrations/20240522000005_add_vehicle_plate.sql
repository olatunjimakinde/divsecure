-- Add vehicle_plate to visitor_codes
alter table public.visitor_codes 
add column vehicle_plate text;

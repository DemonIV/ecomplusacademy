-- The sales team keeps its leads in Airtable ("Satış Takip" base). Each lead
-- remembers its Airtable row, so later stages update that row instead of
-- adding a new one.
alter table leads add column if not exists airtable_record_id text;

alter table media_items add column if not exists series text;
alter table media_items add column if not exists slide_count integer;
alter table media_items add column if not exists content_role text;
alter table media_items add column if not exists ai_confidence double precision;
alter table media_items add column if not exists ai_reason text;
alter table media_items add column if not exists hashtag_set text;

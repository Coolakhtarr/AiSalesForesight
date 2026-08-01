-- Seeds `calendar` with major Indian retail-relevant festival dates so the
-- forecasting and trend models can treat them as first-class demand drivers
-- rather than a generic is_holiday flag. Extend/adjust dates yearly —
-- lunar-calendar festivals (Diwali, Eid, Holi) shift each year.
-- Run this after 0001_init.sql. Safe to re-run (upsert on date).

insert into calendar (date, week, month, year, season, is_holiday, festival_name) values
  ('2026-01-14', 3, 1, 2026, 'winter', true, 'Makar Sankranti / Pongal'),
  ('2026-03-03', 10, 3, 2026, 'spring', true, 'Holi'),
  ('2026-08-15', 33, 8, 2026, 'monsoon', true, 'Independence Day'),
  ('2026-08-26', 35, 8, 2026, 'monsoon', true, 'Raksha Bandhan'),
  ('2026-09-14', 38, 9, 2026, 'monsoon', true, 'Ganesh Chaturthi'),
  ('2026-10-20', 43, 10, 2026, 'autumn', true, 'Dussehra'),
  ('2026-11-08', 45, 11, 2026, 'autumn', true, 'Diwali'),
  ('2026-12-25', 52, 12, 2026, 'winter', true, 'Christmas')
on conflict (date) do update set is_holiday = excluded.is_holiday, season = excluded.season, festival_name = excluded.festival_name;

-- Recommended follow-up: a job that checks "is a festival within the next
-- 21 days?" and, if that product historically spiked around it, writes an
-- analytics_insights row like "Diwali is in 18 days — Ceramic Diyas sold
-- 3.2x normal volume last year around this date. Consider reordering now."

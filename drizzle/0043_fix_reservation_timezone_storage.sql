-- Correct legacy reservation timestamps that were stored as UTC wall-clock.
-- This should run once after deploying the timezone fixes.
-- Safety: only rows created before 2026-02-24 are updated.
with center as (
	select coalesce(
		(select "time_zone" from "app_settings" limit 1),
		'America/Boise'
	) as tz
)
update "reservations" r
set
	"start_time" = (("start_time" at time zone 'UTC') at time zone center.tz),
	"end_time" = (("end_time" at time zone 'UTC') at time zone center.tz)
from center
where r."created_at" < '2026-02-24T00:00:00Z';

/** Time Zone API client — local timezone context for reminders and summaries. */

import { getServerKey } from "@/lib/google/config";
import { GoogleApiError, safeMessage } from "@/lib/google/errors";
import { fetchJson } from "@/lib/google/http";
import type { ApiEnvelope, LatLng, TimezoneResult } from "@/lib/google/schemas";
import { demoTimezone } from "@/test/fixtures/google";

const ENDPOINT = "https://maps.googleapis.com/maps/api/timezone/json";

interface TimezoneUpstream {
  status: string;
  timeZoneId?: string;
  timeZoneName?: string;
  rawOffset?: number;
  dstOffset?: number;
}

export async function getTimezone(
  input: LatLng,
  key: string | undefined = getServerKey(),
  timestampSec: number = Math.floor(Date.now() / 1000),
): Promise<ApiEnvelope<TimezoneResult>> {
  if (!key) return { data: demoTimezone, demo: true };

  const url = `${ENDPOINT}?location=${input.lat},${input.lng}&timestamp=${timestampSec}&key=${key}`;
  const raw = await fetchJson<TimezoneUpstream>(url);

  if (raw.status !== "OK" || !raw.timeZoneId) {
    throw new GoogleApiError("upstream", safeMessage("upstream"), 502);
  }

  return {
    data: {
      timeZoneId: raw.timeZoneId,
      timeZoneName: raw.timeZoneName ?? raw.timeZoneId,
      rawOffsetSec: raw.rawOffset ?? 0,
      dstOffsetSec: raw.dstOffset ?? 0,
    },
    demo: false,
  };
}

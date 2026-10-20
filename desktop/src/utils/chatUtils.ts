import { Message, DirectMessage } from "../types";

/**
 * Checks whether two timestamps/times are within a given time window (default 2 minutes).
 * Supports numeric epoch timestamps, ISO timestamp strings, and "HH:mm" / "HH:mm:ss" clock formats.
 */
export function isWithinTimeWindow(
  prevTime?: string,
  prevTimestamp?: number | string,
  currTime?: string,
  currTimestamp?: number | string,
  maxWindowMinutes: number = 2
): boolean {
  // 1. Convert to epoch milliseconds if available
  const getEpochMs = (timeStr?: string, timestampVal?: number | string): number | null => {
    if (typeof timestampVal === "number" && !isNaN(timestampVal) && timestampVal > 0) {
      return timestampVal;
    }
    if (typeof timestampVal === "string" && timestampVal.trim()) {
      const parsed = Date.parse(timestampVal);
      if (!isNaN(parsed)) return parsed;
    }
    if (timeStr && timeStr.trim()) {
      const parsed = Date.parse(timeStr);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  };

  const prevEpoch = getEpochMs(prevTime, prevTimestamp);
  const currEpoch = getEpochMs(currTime, currTimestamp);

  if (prevEpoch !== null && currEpoch !== null) {
    const diffMs = currEpoch - prevEpoch;
    // Messages must be chronologically ordered or identical, and within window
    return diffMs >= 0 && diffMs <= maxWindowMinutes * 60 * 1000;
  }

  // 2. Fallback: Parse "HH:mm" or "HH:mm:ss" clock strings
  if (prevTime && currTime) {
    const parseClockToSeconds = (str: string): number | null => {
      const match = str.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (!match) return null;
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const s = match[3] ? parseInt(match[3], 10) : 0;
      return h * 3600 + m * 60 + s;
    };

    const prevSec = parseClockToSeconds(prevTime);
    const currSec = parseClockToSeconds(currTime);

    if (prevSec !== null && currSec !== null) {
      let diffSec = currSec - prevSec;
      if (diffSec < 0) {
        // Crossed midnight (e.g. 23:59 to 00:01)
        diffSec += 24 * 3600;
      }
      return diffSec >= 0 && diffSec <= maxWindowMinutes * 60;
    }
  }

  return false;
}

/**
 * Determines whether two consecutive DirectMessages should be grouped in Discord style:
 * same sender (sent by me, or sent by peer), and within 2 minutes.
 */
export function shouldGroupDmMessages(
  prevMsg: DirectMessage | null,
  currMsg: DirectMessage,
  currentUserAin?: string,
  maxWindowMinutes: number = 2
): boolean {
  if (!prevMsg) return false;

  const prevIsMe = prevMsg.senderAin === "self" || (!!currentUserAin && prevMsg.senderAin === currentUserAin);
  const currIsMe = currMsg.senderAin === "self" || (!!currentUserAin && currMsg.senderAin === currentUserAin);

  // Must be both sent by current user, or both sent by the exact same peer
  if (prevIsMe !== currIsMe) return false;
  if (!prevIsMe && prevMsg.senderAin !== currMsg.senderAin) return false;

  return isWithinTimeWindow(
    prevMsg.time,
    prevMsg.timestamp,
    currMsg.time,
    currMsg.timestamp,
    maxWindowMinutes
  );
}

/**
 * Determines whether two consecutive Channel Messages should be grouped in Discord style:
 * same author name, non-boxed, and within 2 minutes.
 */
export function shouldGroupChannelMessages(
  prevMsg: Message | null,
  currMsg: Message,
  maxWindowMinutes: number = 2
): boolean {
  if (!prevMsg) return false;
  if (prevMsg.author !== currMsg.author) return false;
  if (prevMsg.isBoxed || currMsg.isBoxed) return false;

  return isWithinTimeWindow(
    prevMsg.time,
    prevMsg.timestamp,
    currMsg.time,
    currMsg.timestamp,
    maxWindowMinutes
  );
}

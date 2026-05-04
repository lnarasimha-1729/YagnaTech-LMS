/**
 * Zoom provider integration — ZoomMeetingController parity.
 * Until real OAuth + API calls are wired, these return a safe shape that mirrors
 * what Laravel's controller used: { id, join_url, start_url, start_time, topic }.
 * Downstream code (live-class admin) treats a missing `id` or `{code,message}`
 * as an error, matching PHP behavior.
 */

function notConfigured(op) {
  return {
    code: 'ZOOM_NOT_CONFIGURED',
    message: `Zoom ${op} failed: provider is not configured`,
  };
}

async function createMeeting(title, startTimestamp, durationMinutes) {
  // TODO: call Zoom API with OAuth creds from env.
  return notConfigured('createMeeting');
}

async function updateMeeting(title, startTime, meetingId) {
  return notConfigured('updateMeeting');
}

async function deleteMeeting(meetingId) {
  return notConfigured('deleteMeeting');
}

module.exports = { createMeeting, updateMeeting, deleteMeeting };

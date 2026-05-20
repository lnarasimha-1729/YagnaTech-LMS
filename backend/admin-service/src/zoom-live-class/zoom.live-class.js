/**
 * Zoom-only helpers for the Course Player live-class flow.
 *
 * Lives next to live-class.{service,controller,routes}.js so the generic
 * live-class module stays provider-agnostic and Zoom-specific logic (Web SDK
 * signature minting, meeting-status sync) is in one file.
 */

const { HttpError } = require('../middlewares/error');
const zoom = require('./zoom.service');
const liveClassService = require('./live-class.service');

/**
 * Mint a Web SDK JWT for the given live class on behalf of the current user.
 * Reuses live-class.service.resolveJoin() so permission rules stay in one place.
 *
 * Returns: { signature, sdkKey, meetingNumber, password, role }
 */
const buildSdkAuth = async ({ id, user }) => {
    const row = await liveClassService.findOrFail(id);
    if (row.provider !== 'zoom') throw new HttpError(422, 'Provider is not Zoom.');

    const info = liveClassService.parseAdditionalInfo(row.additional_info);
    if (!info.id) throw new HttpError(422, 'Meeting has no Zoom id.');

    const decision = await liveClassService.resolveJoin({ id, user });
    if (decision.mode === 'unavailable') {
        throw new HttpError(422, decision.reason || 'Live class is unavailable.');
    }

    const sig = await zoom.generateSdkSignature(info.id, decision.role);
    if (sig && sig.code) throw new HttpError(422, sig.message);

    return {
        signature: sig.signature,
        sdkKey: sig.sdkKey,
        meetingNumber: String(info.id),
        password: decision.role === liveClassService.HOST_ROLE ? info.password || '' : '',
        role: decision.role,
    };
};

/**
 * Live status sync from Zoom — drives the "Live now" badge on the player tab.
 * Falls back to schedule-derived status if the Zoom API is unreachable.
 */
const syncStatus = async ({ id }) => {
    const row = await liveClassService.findOrFail(id);
    const info = liveClassService.parseAdditionalInfo(row.additional_info);

    // Manual provider — no Zoom meeting to query. The status is purely
    // schedule-derived (scheduled → live → completed), so the player's
    // "Live now" badge still works from the class date/time.
    if (row.provider === 'manual') {
        return {
            id: Number(id),
            provider: 'manual',
            status: liveClassService.deriveStatus(row),
        };
    }

    if (row.provider !== 'zoom' || !info.id) {
        return { id: Number(id), provider: row.provider, status: 'unavailable' };
    }
    const res = await zoom.getMeetingStatus(info.id);
    if (res && res.code) {
        return {
            id: Number(id),
            provider: 'zoom',
            status: liveClassService.deriveStatus(row),
            error: res.message,
        };
    }
    return { id: Number(id), provider: 'zoom', status: res.status, meeting: res.meeting };
};

module.exports = { buildSdkAuth, syncStatus };

// Todo: Read these core configuration values from the environemnt variables.
export const SESSION_COOKIE_NAME = 'session';
export const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 minutes

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_MARKER_COOKIE_NAME = 'refresh_session';
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

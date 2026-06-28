// Public Vipps Login config (NO secrets — client secret lives in the edge fn).
// Values are placeholders until the Vipps merchant account is live; the flow is
// exercised in stub mode where the code value is irrelevant.
export const VIPPS_STUB = true;

// The deployed vipps-login edge function URL.
export const LOGIN_FN_URL =
  `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/vipps-login`;

// OIDC authorize endpoint + app redirect target (real values at cutover).
export const CLIENT_ID = process.env.EXPO_PUBLIC_VIPPS_CLIENT_ID || 'stub-client-id';
export const AUTHORIZE_URL =
  process.env.EXPO_PUBLIC_VIPPS_AUTHORIZE_URL || 'https://stub.vipps/authorize';
export const REDIRECT_URI =
  process.env.EXPO_PUBLIC_VIPPS_REDIRECT_URI || 'parkno://vipps-callback';

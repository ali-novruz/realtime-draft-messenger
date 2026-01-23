export const SHARED_APP_NAME = "LiveDraftChat";

// Basic types for MVP (will be expanded)
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

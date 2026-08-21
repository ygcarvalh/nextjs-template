export type FormState = {
  error: string | null;
  requestId?: string | null;
  done?: boolean;
};

export const initialState: FormState = { error: null };

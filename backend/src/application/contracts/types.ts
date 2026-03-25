export interface IApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details: unknown | null;
    requestId: string;
  };
}

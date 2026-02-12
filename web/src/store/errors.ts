export interface ValidationError {
  code: string;
  message: string;
  path: (string | number)[];
  expected?: string;
  format?: string;
}

export interface ValidationErrorResponse {
  type: string;
  errors: ValidationError[];
}

export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
}

export type FetchBaseQueryError = {
  status: number;
  data: ValidationErrorResponse[] | ApiErrorResponse | string;
};

export type SerializedError = {
  name?: string;
  message?: string;
  stack?: string;
  code?: string;
};

export type RTKQueryError = FetchBaseQueryError | SerializedError;

interface RejectResponse {
  reject: string
}

interface ErrorResponse {
  error: string
}

interface PayloadResponse {
  domain: string
  event: string
  payload: any
}

interface KeyResponse {
  key: string
}

interface AnyResponse {
  [propName:string]:any
}

type DispatchResponse = RejectResponse | ErrorResponse | PayloadResponse
type TaskResponse = KeyResponse | ErrorResponse
type AuthResponse = RejectResponse | ErrorResponse | AnyResponse
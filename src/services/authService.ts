import { apiClient } from "@/lib/apiClient";
import type { AuthResponseDto, LoginRequestDto } from "@/types/api";

/**
 * The only call the admin panel makes before it has a token, and the only one that produces one.
 *
 * A refused login throws an `ApiError` with status 401 and no body, so there is nothing to tell a
 * wrong email apart from a wrong password — which is the point.
 */
export const authService = {
  login(credentials: LoginRequestDto): Promise<AuthResponseDto> {
    return apiClient.post<AuthResponseDto>("/auth/login", credentials);
  },
};

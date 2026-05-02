import { useAuth } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export { getGetMeQueryKey };

export function useCurrentUser() {
  const { isSignedIn, isLoaded } = useAuth();
  return useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: isLoaded && !!isSignedIn,
      staleTime: 60_000,
      retry: 1,
    },
  });
}

export function useCurrentUserId(): number | undefined {
  const { data } = useCurrentUser();
  return data?.id;
}

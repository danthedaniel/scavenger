import { useRouter } from "next/router";

export function useQuery(key: string) {
  const router = useRouter();

  return [router.query[key]].flat()[0];
}

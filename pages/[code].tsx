import { GetServerSideProps } from "next";

import { ZONES } from "~/components/map";
import { default as MapPage, MapPageProps } from "~/pages/index";

export const getServerSideProps: GetServerSideProps<MapPageProps> = async (
  context
) => {
  const { code: codeParam } = context.params ?? {};
  if (!codeParam) return { props: {} };

  const code = (
    Array.isArray(codeParam) ? codeParam[0] : codeParam
  ).toUpperCase();
  if (!ZONES.find((zone) => zone.code === code)) return { notFound: true };

  return { props: { code } };
};

export default MapPage;

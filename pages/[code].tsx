import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { code } = context.params ?? {};
  if (typeof code !== "string") return { notFound: true };

  const params = new URLSearchParams({ code });

  return {
    redirect: {
      destination: `/?${params.toString()}`,
      permanent: false,
    },
  };
};

function CodePage() {
  return null;
}

export default CodePage;

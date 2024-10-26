import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { code } = context.params ?? {};

  return {
    redirect: {
      destination: `/?code=${code}`,
      permanent: false,
    },
  };
};

function CodePage() {
  return null;
}

export default CodePage;

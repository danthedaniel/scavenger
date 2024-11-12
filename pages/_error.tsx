import Error, { type ErrorProps } from "next/error";
import { type NextPageContext } from "next/types";

import * as Sentry from "@sentry/nextjs";

function CustomErrorComponent(props: ErrorProps) {
  return (
    <Error
      title="An application error has occurred. It has been automatically reported to the developer."
      statusCode={props.statusCode}
    />
  );
}

CustomErrorComponent.getInitialProps = async (contextData: NextPageContext) => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  await Sentry.captureUnderscoreErrorException(contextData);

  // This will contain the status code of the response
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;

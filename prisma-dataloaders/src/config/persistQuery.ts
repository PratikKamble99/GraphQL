import { GraphQLError } from "graphql";

export const blockNonPersistedQueries = {
  async requestDidStart() {
    return {
      async didResolveOperation({ request }: { request: any }) {
        const hasPersistedQuery =
          !!request.extensions?.persistedQuery;

        if (
          process.env.NODE_ENV === "production" &&
          !hasPersistedQuery
        ) {
          throw new GraphQLError(
            "Only persisted queries are allowed in production"
          );
        }
      },
    };
  },
};

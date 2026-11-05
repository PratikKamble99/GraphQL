import { GraphQLError } from "graphql";
import {
  createComplexityRule,
  simpleEstimator,
} from "graphql-query-complexity";

export const complexityRule = createComplexityRule({
  maximumComplexity: 1000,
  // Optional callback function to retrieve the determined query complexity
  // Will be invoked whether the query is rejected or not
  // This can be used for logging or to implement rate limiting
  onComplete: (complexity: number) => {
    console.log("Determined query complexity: ", complexity);
  },

  // Optional function to create a custom error
  createError: (max: number, actual: number) => {
    return new GraphQLError(
      `Query is too complex: ${actual}. Maximum allowed complexity: ${max}`
    );
  },
  estimators: [
    simpleEstimator({
      defaultComplexity: 1,
    }),
  ],
});

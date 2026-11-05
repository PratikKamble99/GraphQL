import { stitchSchemas } from "@graphql-tools/stitch";
import { delegateToSchema } from "@graphql-tools/delegate";

import { postSchema } from "./postSchema.js";
import { userSchema } from "./userSchema.js";

export const stitchedSchema = stitchSchemas({
  subschemas: [
    { schema: userSchema },
    { schema: postSchema }
  ],
  typeDefs: `
    extend type User {
      posts: [Post!]!
    }
  `,
  resolvers: {
    User: {
      posts: {
        selectionSet: `{ id }`,
        resolve(parent, _, context, info: any) {
          return delegateToSchema({
            schema: postSchema,
            fieldName: "postsByUser",
            args: { userId: parent.id },
            context,
            info
          });
        }
      }
    }
  }
});

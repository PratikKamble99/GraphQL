import crypto from "crypto";

crypto
  .createHash("sha256")
  .update(
    `
    query GetUsers {
      users {
        id
        name
      }
    }
  `
  )
  .digest("hex");

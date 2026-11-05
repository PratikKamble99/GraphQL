import { Redis } from "ioredis";

export const redis = new Redis(
  "rediss://default:AWyKAAIncDE4ZThjOTY4NGY3ZGQ0NjdmOTk3MGRjZDY4YjQ3OTVhNXAxMjc3ODY@meet-tadpole-27786.upstash.io:6379"
);

export function testRedis() {
  redis.set("mykey", "value");

  redis.get("mykey", (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log(result); // Prints "value"
    }
  });
}
redis.on("error", (err) => console.error("Redis Client Error", err));
redis.on("connect", () => console.log("Connected to Redis"));

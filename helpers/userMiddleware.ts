import { Context, validateJwt } from "../dependencies.ts";
import { users, User } from "../users.ts";

const key = Deno.env.get("JWT_KEY") || "";

const userMiddleware = async (ctx: Context, next: Function) => {
  const jwt = ctx.cookies.get("jwt");
  if (jwt) {
    const data: any = await validateJwt({ jwt, key, algorithm: "HS256" });
    if (data) {
      const user = users.find((u: User) => (u.username = data.payload.iss));
      ctx.state.currentUser = user;
    } else {
      ctx.cookies.delete("jwt");
      ctx.state.currentUser = null;
    }
  } else {
    ctx.state.currentUser = null;
  }
  await next();
};

export default userMiddleware;

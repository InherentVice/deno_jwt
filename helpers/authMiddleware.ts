import { Context, validateJwt } from "../dependencies.ts";
import { users, User } from "../users.ts";

const key = Deno.env.get("JWT_KEY") || "";

const authMiddleware = async (ctx: Context, next: Function) => {
  if (!ctx.state.currentUser) {
    ctx.response.redirect("/login");
  } else {
    await next();
  }
};

export default authMiddleware;

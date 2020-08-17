import {
  renderFileToString,
  RouterContext,
  hashSync,
  compareSync,
  makeJwt,
  setExpiration,
  Jose,
  Payload,
} from "./dependencies.ts";
import { users, User } from "./users.ts";

export const home = async (ctx: RouterContext) => {
  const user = ctx.state.currentUser;
  ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
    user,
  });
};

export const login = async (ctx: RouterContext) => {
  ctx.response.body = await renderFileToString(
    `${Deno.cwd()}/views/login.ejs`,
    { error: null },
  );
};

export const register = async (ctx: RouterContext) => {
  ctx.response.body = await renderFileToString(
    `${Deno.cwd()}/views/register.ejs`,
    { user: null },
  );
};

export const protectedRoute = async (ctx: RouterContext) => {
  ctx.response.body = await renderFileToString(
    `${Deno.cwd()}/views/protected.ejs`,
    { user: null },
  );
};

export const postLogin = async (ctx: RouterContext) => {
  const body = await ctx.request.body();
  const value = await body.value;
  const username = value.get("username");
  const password = value.get("password");
  const user = users.find((user) => user.username === username);
  if (!user) {
    ctx.response.body = await renderFileToString(
      `${Deno.cwd()}/views/login.ejs`,
      {
        error: "Incorrect Username",
      },
    );
  } else if (!compareSync(password, user.password)) {
    ctx.response.body = await renderFileToString(
      `${Deno.cwd()}/views/login.ejs`,
      {
        error: "Incorrect Password",
      },
    );
  } else {
    const key = Deno.env.get("JWT_KEY") || "";
    const header: Jose = {
      alg: "HS256",
      typ: "JWT",
    };
    const payload: Payload = {
      iss: user.username,
      exp: setExpiration(new Date().getTime() + 1000 * 60 * 60),
    };
    const jwt = await makeJwt({ key, header, payload });
    ctx.cookies.set("jwt", jwt);
    ctx.response.redirect("/");
  }
};

export const postRegister = async (ctx: RouterContext) => {
  const body = await ctx.request.body();
  const value = await body.value;
  const name = value.get("name");
  const username = value.get("username");
  const plainPwd = value.get("password");
  const password = hashSync(plainPwd);

  const user: User = { name, username, password };
  users.push(user);
  ctx.response.redirect("/login");
};

export const logout = async (ctx: RouterContext) => {
  ctx.cookies.delete("jwt");
  ctx.response.redirect("/");
};

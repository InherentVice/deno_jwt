import "https://deno.land/x/dotenv@v0.5.0/mod.ts";
import { Application, Router } from "./dependencies.ts";
import {
  home,
  login,
  register,
  protectedRoute,
  postLogin,
  postRegister,
  logout,
} from "./routes.ts";
import userMiddleware from "./helpers/userMiddleware.ts";
import authMiddleware from "./helpers/authMiddleware.ts";

const app = new Application();
const router = new Router();
const port = 8000;

app.use(userMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());
app.addEventListener("error", (e) => console.log(e.error));

router
  .get("/", home)
  .get("/login", login)
  .get("/register", register)
  .get("/protected", authMiddleware, protectedRoute)
  .post("/login", postLogin)
  .post("/register", postRegister)
  .get("/logout", logout);

app.listen({ port });
console.log(`Server started on port ${port}`);

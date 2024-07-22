import { Application } from "oak";

import cors from "./middlewares/cors.ts";
import debug from "./middlewares/debug.ts";
import favicon from "./middlewares/favicon.ts";
import formatEncodingParam from "./middlewares/encodings.ts";
import notFound from "./middlewares/not-found.ts";
import router from "./router.ts";

const app = new Application();

app.use(debug, cors, favicon, formatEncodingParam);
app.use(router.routes(), router.allowedMethods());
app.use(notFound);

console.log("service is running at http://localhost:8000");

await app.listen({ port: 8000 });

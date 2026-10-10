
import ServerPages from "@entity-access/server-pages/dist/ServerPages.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import globalEnv from "./globalEnv.js";

export default class WebServer {

    async create() {
        const server = ServerPages.create();

        server.registerRoutes(
            join(dirname(fileURLToPath(import.meta.url)), "./wwwroot/routes"));

        const { port } = globalEnv;

        server.build({
            createSocketService: false,
            host: process.env.HOST,
            port,
            protocol: "http",
            trustProxy: false,
            allowHTTP1: true,
            http1Port: port
        }).catch(console.error);

    }
}
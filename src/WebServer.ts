
import ServerPages from "@entity-access/server-pages/dist/ServerPages.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ensureDir from "./core/FileApi.js";
import { existsSync, unlinkSync } from "node:fs";

export default class WebServer {

    async create() {
        const server = ServerPages.create();

        server.registerRoutes(
            join(dirname(fileURLToPath(import.meta.url)), "./wwwroot/routes"));

        let port = (process.env.PORT || "8080") as any;
        if (/^\d+$/.test(port)) {
            port = Number(port) as any;
        } else {
            const dir = dirname(port);
            ensureDir(dir);
            if(existsSync(port)) {
                unlinkSync(port);
            }
        }

        server.build({
            createSocketService: false,
            host: process.env.HOST,
            port,
            protocol: "http",
            trustProxy: false,
            acmeOptions: null,
            allowHTTP1: true,
            http1Port: port
        }).catch(console.error);

    }
}
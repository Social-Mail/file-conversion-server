import { existsSync, readdirSync, unlinkSync } from "node:fs";
import path, { dirname } from "node:path";
import globalEnv from "../globalEnv.js";

export const UnixSocketPath = {

    deleteIfExists (path: any) {
        if(!path) {
            return;
        }
        if(/^\d+$/i.test(path)) {
            return;
        }
        if(existsSync(path)) {
            unlinkSync(path);
        }
    },

    clearSockets() {
        try {

            const port = globalEnv.port;
            if(typeof port === "number") {
                return;
            }

            const dir = dirname(port);

                    // clear all sockets folder...
            if(existsSync(dir)) {
                for(const item of readdirSync(dir, { withFileTypes: true, recursive: true })) {
                    try {
                        unlinkSync(path.join(item.parentPath, item.name));
                    } catch {

                    }
                }
            }
        } catch (error) {
            console.error(error);            
        }
    }

}
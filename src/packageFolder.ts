import { fileURLToPath } from "node:url";

export const packageFolder = {

    resolveFile(path) {
        return fileURLToPath(import.meta.resolve("../" + path));
    }

};
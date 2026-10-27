import { fileURLToPath } from "url";
import IImageConverter from "./image-converter/IImageConverter.js";
import IExtract from "./extract/IExtract.js";
import { spawnPromise } from "../../core/spawnPromise.js";
import transform from "./image-converter/transform.js";

export default class IsolatedProcess {

    static convertImage(p: IImageConverter) {
        return transform(p);
        // return spawnPromise(process.execPath, [
        //     "--enable-source-maps",
        //     fileURLToPath(import.meta.resolve("./image-converter/index.js")),
        //     JSON.stringify(p),
        // ], {
        //     logCommand: false,
        //     logError: true
        // });
    }

    static async extractText(p: IExtract) {
        const result = await spawnPromise(process.execPath, [
            "--enable-source-maps",
            "--max-old-space-size=8192",
            fileURLToPath(import.meta.resolve("./extract/index.js")),
            JSON.stringify(p),
        ], {
            env: {
                NODE_OPTIONS: "--max-old-space-size=8192"
            },
            logCommand: false,
            logError: true
        });

        return result.all;
    }

}
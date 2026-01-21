/* eslint-disable no-console */
import { readFile } from "fs/promises";
import tesseract from "tesseract.js";
import { parentPort } from "worker_threads";
import FileInfo from "./FileInfo.js";
const { recognize } = tesseract;

export class ExtractWorker {
    static async text(file: FileInfo, useOcr = false) {
        try {
            if (/^image\//.test(file.contentType)) {
                if (useOcr) {
                    return this.ocr(file);
                }
            }

            return await readFile(file.path, "utf-8");
        } catch (error) {
            console.error(error);
        }
        return "";

    }

    static async ocr(file: FileInfo) {
        try {
            const buffer = await readFile(file.path);
            const result = await recognize(buffer);
            return result.data.text;
        } catch (error) {
            console.error(error);
        }
        return "";
    }
};

parentPort.on("message", async ({ file, useOcr }) => {
    try {
        const result = await ExtractWorker.text(file, useOcr);
        parentPort.postMessage({ result });
        process.exit(0);
    } catch (error) {
        try {
            parentPort.postMessage({ error: error.stack ?? error.toString() });
        } catch (er1) {
            // we will ignore this..  we need to close process successfully.
        }
        process.exit(0);
    }
});
/* eslint-disable no-console */
import { copyFile, readFile, writeFile } from "fs/promises";
import tesseract from "tesseract.js";
import FileInfo from "../FileInfo.js";
import IExtract from "./IExtract.js";
const { recognize } = tesseract;

export class ExtractWorker {
    static async text({ input: file, useOcr, output }: IExtract) {
        try {
            if (/^image\//.test(file.contentType)) {
                if (useOcr) {
                    return this.ocr(file, output);
                }
            }

            await copyFile(file.path, output.path);
            return;
        } catch (error) {
            console.error(error);
        }
    }

    static async ocr(file: FileInfo, output: { path: string}) {
        const buffer = await readFile(file.path);
        const result = await recognize(buffer);
        await writeFile(output.path, result.data.text, "utf-8");
    }
};


const [_execPath, _self, p] = process.argv;


ExtractWorker.text(JSON.parse(p))
    .then((r) => console.log(r))
    .catch(console.error);


// parentPort.on("message", async ({ file, useOcr }) => {
//     try {
//         const result = await ExtractWorker.text(file, useOcr);
//         parentPort.postMessage({ result });
//         process.exit(0);
//     } catch (error) {
//         try {
//             parentPort.postMessage({ error: error.stack ?? error.toString() });
//         } catch (er1) {
//             // we will ignore this..  we need to close process successfully.
//         }
//         process.exit(0);
//     }
// });
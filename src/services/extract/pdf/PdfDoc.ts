import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { readFile, readdir } from "fs/promises";
import { join } from "node:path";
import { spawnPromise } from "../../../core/spawnPromise.js";
import { tempDiskCache } from "../../../core/tempDiskCache.js";
import DataUrl from "../../../core/DataUrl.js";

export default class PdfDoc {

    static async extract(file: LocalFile, outputFile: LocalFile) {
        await spawnPromise("pdftotext", [
            file.path,
            outputFile.path,
        ], {
            logData: false,
            timeout: 5*60*1000
        });
        return outputFile;
    }

    static async extractAsHtmlToFile(src: LocalFile, output: LocalFile) {
        using folder = tempDiskCache.newFolder("pdf-to-html");
        const file = folder.get(src.fileName, src.contentType);
        await src.copyTo(file);
        await spawnPromise("pdftohtml", [
            "-c",
            "-s",
            file.path,
            "index"
        ], {
            cwd: folder.folder
        });

        const outputFile = folder.get("index-html.html", "text/html");

        const files = await readdir(folder.folder, { withFileTypes: true });

        const images = await Promise.all(files.map(async (x) => ({
            name: `"${x.name}"`,
            url: DataUrl.from(await readFile(join(folder.folder, x.name)), "image/png")
        })));

        let text = await outputFile.readAsText();

        // replace all images...
        for (const image of images) {
            text = text.replaceAll(image.name, image.url);
        }

        await output.writeAllText(text);
    }

}
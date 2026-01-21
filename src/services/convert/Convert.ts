/* eslint-disable no-console */
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { copyFile, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { JSDOM } from 'jsdom';
import { spawnPromise } from "../../core/spawnPromise.js";
import { tempDiskCache } from "../../core/tempDiskCache.js";

export const Convert = {

    async convert (file: LocalFile, method: "pdf" | "png" | "text" | "html", output: string) {
        let args: string[];
        let ext = /./;
        switch(method) {
            case "pdf":
                args = ["--convert-to", "pdf"];
                ext = /\.pdf$/i;
                break;
            case "png":
                args = ["--convert-to", "png"];
                ext = /\.png$/i;
                break;
            case "text":
                args = ["--convert-to", "txt"];
                ext = /\.txt$/i;
                break;
            case "html":
                args = ["--convert-to", "html:HTML:EmbedImages"];
                ext = /\.html$/i;
                break;
        }
        return this.execute(file, args, ext, output);
    },


    async execute (file: LocalFile, args: string[], ext: RegExp, output: string) {
        try {

            if (args[1] === "txt") {
                // txt hangs, so lets use to html and convert
                args[1] = "html";

                await this.execute(file, args, /\.html$/, output);

                let text = "";
                const of = await stat(output);
                if (of.size < 10*1024*1024) {

                    const htmlText = await readFile(output, "utf-8");
                    const { window } = new JSDOM(htmlText);
                    text = window.document.documentElement.innerText ?? window.document.body.innerText ?? htmlText;
                }
                await writeFile(output, text);
                return output;
            }

            using dir = tempDiskCache.newFolder("convert");
            const dirUri = pathToFileURL(dir.folder);
            const path = dir.get(file.fileName, file.contentType);
            await file.copyTo(path);
            await spawnPromise("libreoffice", [
                `-env:UserInstallation=${dirUri}`,
                "--headless",
                ... args,
                "--outdir", dir.folder,
                path.path,
                "--invisible",
                "--nologo"
            ]);
            for(const child of await readdir(dir.folder, { withFileTypes: true })) {
                const o = join(dir.folder, child.name);
                if(ext.test(child.name)) {
                    await copyFile(o, output);
                    return output;
                }
            }
            return output;
        } catch (error) {
            console.error(error.stack || error.toString());
        }
        return "";
    }

};

// if (isTestMode) {
//     Convert.convert = async (s, m , output) => {
//         writeFileSync(output, "Text");
//         return output;
//     };
// }
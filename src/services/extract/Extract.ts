/* eslint-disable no-console */
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { copyFile } from "fs/promises";
import { Convert } from "../convert/Convert.js";
import PdfDoc from "./pdf/PdfDoc.js";
import LockFile from "../../core/LockFile.js";
import { tempDiskCache } from "../../core/tempDiskCache.js";
import IsolatedProcess from "../isolated/IsolatedProcess.js";
import { FileType } from "../../core/FileType.js";

export class Extract {

    static async text(src: LocalFile, outputFile: LocalFile, useOcr = false) {
        await this.internalText(src, outputFile, useOcr);
    }

    private static async internalText(src: LocalFile, outputFile: LocalFile, useOcr = false) {

        if (FileType.isMedia(src)) {
            // currently we are not going to support
            // extracting text from audio/video

            // in future might provide some sort of
            // caption extraction or title information
            // extraction
            await outputFile.writeAllText("");
            return;
        }

        using folder = tempDiskCache.newFolder("to-text-"+ Date.now());
        const file = folder.get(src.fileName, src.contentType);
        await src.copyTo(file);

        if (FileType.isPdf(file)) {
            await PdfDoc.extract(file, outputFile);
            return;
        }

        if (FileType.isCode(file)) {
            await copyFile(file.path, outputFile.path);
            return;
        }

        if (!FileType.isImage(file)) {

            if (/\.dat$/i.test(file.fileName)) {
                return "";
            }

            await Convert.convert(file, "text", outputFile.path);
            return;
        }

        using _lock = await LockFile.lock("extract-worker-lock");

        return await IsolatedProcess.extractText({
            input: {
                fileName: file.fileName,
                contentType: file.contentType,
                path: file.path
            },
            output: {
                path: outputFile.path
            },
            useOcr
        });
    }
};
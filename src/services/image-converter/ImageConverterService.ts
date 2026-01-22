import { RegisterScoped } from "@entity-access/entity-access/dist/di/di.js";
import { join, parse } from "path";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { Convert } from "../convert/Convert.js";
import { copyFile, readdir } from "fs/promises";
import FFCommand from "../convert/FFCommand.js";
import { fileURLToPath } from "url";
import { tempDiskCache } from "../../core/tempDiskCache.js";
import { spawnPromise } from "../../core/spawnPromise.js";
import { ImagesFolder } from "../../core/ImagesFolder.js";
import IsolatedProcess from "../isolated/IsolatedProcess.js";

@RegisterScoped
export default class ImageConverterService {

    async getImage(file: LocalFile, pageNumber?, retry = true) {

        let outputFile: LocalFile;
        let copy: LocalFile;

        if (/^image\//.test(file.contentType)) {

            if (/(\.bmp|\.ico)$/i.test(file.fileName)) {
                using f1 = tempDiskCache.newFolder("bpm-to-png");
                copy = await f1.copy(file.fileName, file, file.contentType);
                outputFile = await tempDiskCache.createTempFile("png.png", "image/png");
                await spawnPromise("convert", [
                    copy.path,
                    outputFile.path
                ]);
                return outputFile;
            }

            return file;
        }


        using folder = tempDiskCache.newFolder("image-converter");
        copy = await folder.copy(file.fileName, file, file.contentType);
        outputFile = await tempDiskCache.createTempFile("png.png", "image/png");

        if (/^video\//.test(file.contentType)) {
            // this is a video..
            await FFCommand.thumbnail(file, outputFile);
            return outputFile;
        }

        if (/^image\//.test(file.contentType)) {
            return ImagesFolder.localFile("png", "audio.png");
        }

        if(/pdf/i.test(file.contentType)) {

            const args = [
                "-singlefile",
                "-png",
                copy.path,
                "png"
            ];
            if (pageNumber) {
                args.push("-f");
                args.push(Number(pageNumber).toString());
            }

            await spawnPromise("pdftoppm", args, {
                cwd: folder.folder
            });

            const isPng = /\.png$/i;

            for (const child of await readdir(folder.folder, { withFileTypes: true})) {
                const output = join(child.parentPath, child.name);
                if (isPng.test(child.name)) {
                    await copyFile(output, outputFile.path);
                    return outputFile;
                }
            }

            if (outputFile.isEmpty) {
                return ImagesFolder.localFile("png", "protected.png");
            }
        }

        // this is some kind of document??
        await Convert.convert(copy, "png", outputFile.path);
        return outputFile;
    }

    async transform(type, file: LocalFile, outputFileName = "file.jpg", retry = true) {
        try {
            return await this.transformInternal(type, file, outputFileName);
        } catch (error) {
            if(error.toString().includes("No decoding plugin")) {
                if (retry) {
                    // we will use vips to convert file to jpg
                    const { name } = parse(file.fileName);
                    const output = await tempDiskCache.createTempFile( `${name}.png`, "image/png");
                    const modulePath = fileURLToPath(import.meta.resolve("./external/convert-heic.js"));
                    await spawnPromise(process.execPath, [ modulePath ], { env: { FILE_IN: file.path, FILE_OUT: output.path }});
                    return await this.transform(type, output, outputFileName, false);
                }
            }
            throw error;
        }
    }

    private async transformInternal(type, file: LocalFile, outputFileName = "file.jpg") {

        let fileName = type;
        const matches = type.match(/(\w+)\(?([^\)]*)\)?/);
        let args = [];
        if (matches) {
            fileName = matches[1];
            args = matches[2].split(',').map( (x) => /^\d/.test(x) ? parseFloat(x) : x);
            switch(fileName) {
                case "jpg":
                case "png":
                case "gif":
                case "webp":
                case "ico":
                    fileName = "size";
                    break;
            }
        }

        file = await this.getImage(file, args?.[2] ?? void 0);
        if (file.isEmpty) {
            file = ImagesFolder.localFile("png", "unavailable.png");
        }

        const tf = await tempDiskCache.createTempFile(outputFileName);

        const result = await IsolatedProcess.convertImage({
            type,
            input: { path: file.path },
            output: { path: tf.path },
            outputFileName
        });

        if (tf.isEmpty || result.status !== 0) {
            throw new Error(`Image conversion failed from ${file.path} to ${tf.path} ${result.all}`);
        }

        return tf;
    }

}
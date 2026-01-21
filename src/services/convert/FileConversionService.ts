import Inject, { RegisterScoped } from "@entity-access/entity-access/dist/di/di.js";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { Convert } from "./Convert.js";
import PdfDoc from "../extract/pdf/PdfDoc.js";
import FFCommand from "./FFCommand.js";
import StringFormat from "../../core/StringFormat.js";
import ImageConverterService from "../image-converter/ImageConverterService.js";
import { tempDiskCache } from "../../core/tempDiskCache.js";

interface IDownloadConvertedFile {
    input: LocalFile;
    type: string;
    fileName: string;
    senderDomain?
}

@RegisterScoped
export default class FileConversionService {


    @Inject
    private ics: ImageConverterService;

    async downloadConvertedFile({
        input,
        type,
        fileName,
        senderDomain
    }: IDownloadConvertedFile ): Promise<LocalFile> {

        const file = input;

        // transform here...
        if (/^(size|jpg|png|webp|gif|face\-circle)\(?/i.test(type)) {
            // resize...
            return await this.ics.transform(type, file, fileName );
        }

        if (/^webm\-branded?$/i.test(type)) {
            const ics = this;
            return await ics.webmBranded(file, senderDomain );
        }

        if (/^webm/i.test(type)) {
            return await this.webm(file );
        }

        if (/^(pdf|html)$/i.test(type)) {
            return await this[StringFormat.toCamelCase(type)](file, fileName );
        }

        return input;
    }

    async pdf(file: LocalFile) {
        if (/pdf/i.test(file.contentType) || /\.pdf$/i.test(file.fileName)) {
            return file;
        }

        const output = await tempDiskCache.createTempFile(".pdf", file.fileName + ".pdf", "application/pdf");
        await Convert.convert(file, "pdf", output.path);
        return output;
    }

    async html(file: LocalFile) {
        if (/html/i.test(file.contentType) || /\.html$/i.test(file.fileName)) {
            return file;
        }

        const output = await tempDiskCache.createTempFile(".html", file.fileName + ".html", "text/html");

        if (/text\//.test(file.contentType)) {

            // display text inside pre

            let html = await file.readAsText();

            html = html.split("\n").join("\n</br>\n");

            const text = `<!DOCTYPE html><html>
                <body>
                    <pre>${html}</pre>
                </body>
            </html>`;
            await output.writeAllText(text);
            return output;
        }

        if (/pdf/i.test(file.contentType) || /\.pdf$/i.test(file.fileName)) {
            await PdfDoc.extractAsHtmlToFile(file, output);
            return output;
        }

        await Convert.convert(file, "html", output.path);
        return output;
    }

    async webm(file: LocalFile) {
        if (!/^(video|audio)\//i.test(file.contentType)) {
            throw new Error("Not an audio or video file");
        }
        if (/\.webm$/i.test(file.fileName)) {
            return file;
        }
        const output = await tempDiskCache.createTempFile(".webm", file.fileName + ".webm", "video/webm");
        return FFCommand.webm(file, output);
    }

    async webmBranded(file: LocalFile, senderDomain) {

        const text = "https://" + senderDomain;

        if (!/^(video|audio)\//i.test(file.contentType)) {
            throw new Error("Not an audio or video file");
        }
        if (/\.webm$/i.test(file.fileName)) {
            return file;
        }
        const output = await tempDiskCache.createTempFile(".webm", file.fileName + ".webm", "video/webm");
        return FFCommand.webmText(file, text, output);
    }

}
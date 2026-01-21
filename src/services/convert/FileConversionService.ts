import Inject, { RegisterScoped, ServiceProvider } from "@entity-access/entity-access/dist/di/di.js";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import TimeSpan from "@entity-access/entity-access/dist/types/TimeSpan.js";

interface IDownloadConvertedFile {
    appFile: AppFile;
    fileContentID?: number;
    type: string;
    fileName: string;
    senderDomain?: string;
    key?: string;
}

@RegisterScoped
export default class FileConversionService {

    @Inject
    private tempFileService: TempFileService;

    async downloadConvertedFile({
        appFile,
        fileContentID,
        type,
        fileName,
        key = `/file/${type}/${fileContentID ?? appFile.fileContentID}/${fileName}`,
        senderDomain
    }: IDownloadConvertedFile ): Promise<LocalFile> {

        let file: LocalFile;

        const ttl = TimeSpan.fromDays(30);

        // transform here...
        if (/^(size|jpg|png|webp|gif|face\-circle)\(?/i.test(type)) {

            return await this.cacheService.get({ key, ttl,
                factory: async () => {

                    file = await this.downloadFileContent(appFile, fileContentID);
                    using _fl = await LockFile.lock(`${globalEnv.serverID}-${process.pid}-img`);
                    // resize...
                    const ics = ServiceProvider.resolve(this, ImageConverterService);
                    return await ics.transform(type, file, fileName );
                }
            });
        }

        if (/^webm\-branded?$/i.test(type)) {
            return await this.cacheService.get({ key, ttl,
                factory: async () => {
                    file = await this.downloadFileContent(appFile, fileContentID);
                    using _fl = await LockFile.lock(`${globalEnv.serverID}-video`);
                    const ics = this;
                    return await ics.webmBranded(file, senderDomain );
                }
            });
        }

        if (/^webm/i.test(type)) {
            return await this.cacheService.get({ key, ttl,
                factory: async () => {
                    file = await this.downloadFileContent(appFile, fileContentID);
                    using _fl = await LockFile.lock(`${globalEnv.serverID}-video`);
                    const ics = this;
                    return await ics.webm(file );
                }
            });
        }

        if (/^(pdf|html)$/i.test(type)) {
            return await this.cacheService.get({ key, ttl,
                factory: async () => {
                    file = await this.downloadFileContent(appFile, fileContentID);
                    using _fl = await LockFile.lock(`${globalEnv.serverID}-doc`);
                    const ics = this;
                    return await ics[StringFormat.toCamelCase(type)](file, fileName );
                }
            });
        }

        return await this.downloadFileContent(appFile, fileContentID);
    }

    async pdf(file: LocalFile) {
        if (/pdf/i.test(file.contentType) || /\.pdf$/i.test(file.fileName)) {
            return file;
        }

        const output = await this.tempFileService.createTempFile(".pdf", file.fileName + ".pdf", "application/pdf");
        await Convert.convert(file, "pdf", output.path);
        return output;
    }

    async html(file: LocalFile) {
        if (/html/i.test(file.contentType) || /\.html$/i.test(file.fileName)) {
            return file;
        }

        const output = await this.tempFileService.createTempFile(".html", file.fileName + ".html", "text/html");

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
        const output = await this.tempFileService.createTempFile(".webm", file.fileName + ".webm", "video/webm");
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
        const output = await this.tempFileService.createTempFile(".webm", file.fileName + ".webm", "video/webm");
        return FFCommand.webmText(file, text, output);
    }

}
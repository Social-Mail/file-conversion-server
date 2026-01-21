import Inject, { RegisterScoped } from "@entity-access/entity-access/dist/di/di.js";
import TempFileService from "../../storage/TempFileService.js";
import EmailParserService from "../../smtp/services/EmailParserService.js";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { parse } from "path";
import { Extract } from "./Extract.js";
import { FileType } from "../../../common/FileType.js";

@RegisterScoped
export default class TextExtractorService {

    @Inject
    tempFileService: TempFileService;

    @Inject
    parser: EmailParserService;

    async extract(file: LocalFile) {

        const { tempFileService, parser } = this;

        const outputFile = await tempFileService.createTempFile(".txt");

        const isEmail = file.contentType === "message/rfc822";
        if(isEmail) {
            const parsedEmail = await parser.parse(file, true);
            await outputFile.appendLine(parsedEmail.text);
            for (const iterator of parsedEmail.attachments) {
                const { ext } = parse(iterator.filename || "file.dat");
                const tf = await tempFileService.createTempFile(ext, iterator.filename, iterator.contentType);
                await tf.writeAll(iterator.content);
                const t = await this.extract(tf);
                if (t) {
                    await outputFile.appendLine(await t.readAsText());
                }
            }

            return outputFile;
        }

        if (/image\//i.test(file.contentType)) {
            await Extract.text(file, outputFile, true);
            return outputFile;
        } if (FileType.canBeCompressed(file)) {
            await Extract.text(file, outputFile);
            return outputFile;
        }
        await outputFile.writeAllText("");
        return outputFile;
    }

}
import Inject, { RegisterScoped } from "@entity-access/entity-access/dist/di/di.js";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { Extract } from "./Extract.js";
import { tempDiskCache } from "../../core/tempDiskCache.js";
import { FileType } from "../../core/FileType.js";
import EmailParserService from "./EmailParserService.js";

@RegisterScoped
export default class TextExtractorService {

    @Inject
    parser: EmailParserService;

    async extract(file: LocalFile) {

        const { parser } = this;

        const outputFile = await tempDiskCache.createTempFile(".txt", "file.txt");

        const isEmail = file.contentType === "message/rfc822";
        if(isEmail) {
            const parsedEmail = await parser.parse(file, true);
            await outputFile.appendLine(parsedEmail.text);
            for (const iterator of parsedEmail.attachments) {
                const tf = await tempDiskCache.createTempFile(iterator.filename, iterator.contentType);
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
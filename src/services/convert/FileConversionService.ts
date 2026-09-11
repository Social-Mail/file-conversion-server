import Inject, { RegisterScoped } from "@entity-access/entity-access/dist/di/di.js";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import ImageConverterService from "../image-converter/ImageConverterService.js";
import LockFile from "../../core/LockFile.js";

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
        if (/^(size|jpg|png|webp|gif|face\-circle|remove-bg|max|avif)\(?/i.test(type)) {
            // resize...
            using _lock = await LockFile.lock("image-conversion-" + process.pid);
            return await this.ics.transform(type, file, fileName );
        }

        return input;
    }

}
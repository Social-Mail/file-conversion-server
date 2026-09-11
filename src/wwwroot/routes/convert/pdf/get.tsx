import LockFile from "../../../../core/LockFile.js";
import { Convert } from "../../../../services/convert/Convert.js";
import BaseConverterPage, { IConvertParams } from "../BaseConverterPage.js";

export default class extends BaseConverterPage {

    async convert({
        input,
        output,
        args
    }: IConvertParams) {

        using _lock = await LockFile.lock("pdf-conversion");
        if (/pdf/i.test(input.contentType) || /\.pdf$/i.test(input.fileName)) {
            return input;
        }
        
        await Convert.convert(input, "pdf", output.path);

        return output;
    }

}
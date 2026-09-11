import LockFile from "../../../../core/LockFile.js";
import { Convert } from "../../../../services/convert/Convert.js";
import PdfDoc from "../../../../services/extract/pdf/PdfDoc.js";
import BaseConverterPage, { IConvertParams } from "../BaseConverterPage.js";

export default class extends BaseConverterPage {

    async convert({
        input,
        output,
        args
    }: IConvertParams) {

        using _lock = await LockFile.lock("html-conversion");
        if (/html/i.test(input.contentType) || /\.html$/i.test(input.fileName)) {
            return input;
        }

        if (/text\//.test(input.contentType)) {

            // display text inside pre

            let html = await input.readAsText();

            html = html.split("\n").join("\n</br>\n");

            const text = `<!DOCTYPE html><html>
                <body>
                    <pre>${html}</pre>
                </body>
            </html>`;
            await output.writeAllText(text);
            return output;
        }

        if (/pdf/i.test(input.contentType) || /\.pdf$/i.test(input.fileName)) {
            await PdfDoc.extractAsHtmlToFile(input, output);
            return output;
        }

        await Convert.convert(input, "html", output.path);

        return output;
    }

}
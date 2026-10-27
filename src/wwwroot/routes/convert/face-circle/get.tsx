import LockFile from "../../../../core/LockFile.js";
import BaseConverterPage, { IConvertParams } from "../BaseConverterPage.js";
import Inject from "@entity-access/entity-access/dist/di/di.js";
import ImageConverterService from "../../../../services/image-converter/ImageConverterService.js";
import faceCircle from "../../../../services/isolated/image-converter/formats/face-circle.js";



export default class extends BaseConverterPage {


    @Inject
    ics: ImageConverterService; 

    async convert({
        input,
        output,
        args
    }: IConvertParams) {

        using _lock = await LockFile.lock("face-circle");

        const image = await this.ics.getImage(input);

        const r = await faceCircle(image);

        await r.toFile(output.path);

        return output;
    }

}
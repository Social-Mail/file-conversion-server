import Page from "@entity-access/server-pages/dist/Page.js";
import { Route } from "@entity-access/server-pages/dist/core/Route.js";
import { TempFileResult } from "@entity-access/server-pages/dist/Content.js";
import { CORS } from "../../../../../../core/CORS.js";
import Inject from "@entity-access/entity-access/dist/di/di.js";
import CaptchaService from "../../../../../../services/captcha/CaptchaService.js";

export default class extends Page {

    @Route
    code: string;

    @Inject
    captchaService: CaptchaService;

    async run() {

        console.log(`HTTP-in: ${this.request.url}`);

        const { code } = this;

        const tf = await this.captchaService.getVideo(code);

        return new TempFileResult(
            tf, {
                contentDisposition: "inline",
                immutable: true,
                etag: false,
                headers: CORS.allowAll
            },
        );
    }
}
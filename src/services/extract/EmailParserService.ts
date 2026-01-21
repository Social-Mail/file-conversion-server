import { RegisterSingleton } from "@entity-access/entity-access/dist/di/di.js";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { ParsedMail, simpleParser } from "mailparser";
import { JSDOM } from "jsdom";
import DOMPurify, { WindowLike } from 'dompurify';

@RegisterSingleton
export default class EmailParserService {

    public async parse(file: LocalFile, sanitize = true) {
        const parsed = await new Promise<ParsedMail>((resolve, reject) => {
            simpleParser(file.openRead(), {
                keepCidLinks: true,
                skipTextLinks: true
            },  (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            });
        });

        if (sanitize) {
            const window = new JSDOM('').window as WindowLike;
            const purify = DOMPurify(window);
            const clean = purify.sanitize( `<div>
                    <style>
                        * {
                            box-sizing: border-box;
                        }
                    </style>
                    ${parsed.html}
                </div>`, { RETURN_DOM: true }) as HTMLElement;

            parsed.html = clean.innerHTML;
            parsed.text = clean.innerText;
        }


        return parsed;
    }
}
import Content from "@entity-access/server-pages/dist/Content.js";
import Page from "@entity-access/server-pages/dist/Page.js";
import HtmlDocument from "@entity-access/server-pages/dist/html/HtmlDocument.js";
import WebAtomsLogo from "@entity-access/server-pages/dist/html/WebAtomsLogo.js";
import XNode from "@entity-access/server-pages/dist/html/XNode.js";

export default class extends Page {

    run() {
        return Content.html(<HtmlDocument>
            <head>
                <meta charset="utf-8"/>
                <meta name="viewport" content="width=device-width, shrink-to-fit=YES, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
            </head>
            <body>
                <WebAtomsLogo/>
                Following methods are available.

                <h1>Convert</h1>
                <section>
                    <form action="/convert/avif(250)/output.avif" method="get" target="_blank">
                        <fieldset>
                            <legend>Url</legend>
                            <input name="sourceUrl" value="https://"/>
                        </fieldset>
                        <button type="submit">Go</button>
                    </form>
                </section>
            </body>
        </HtmlDocument>);
    }
}
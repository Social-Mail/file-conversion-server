import { Query } from "@entity-access/server-pages/dist/core/Query.js";
import Page from "@entity-access/server-pages/dist/Page.js";
import { downloadFileToTemp } from "../../../../core/tempDiskCache.js";
import FFProbe from "../../../../services/convert/FFProbe.js";

export default class extends Page {

    @Query("sourceUrl")
    sourceUrl: string;

    async run() {

        const input = await downloadFileToTemp(this.sourceUrl);
        
        const { isMobileReady, needsFastStart, lessThan780p } = await FFProbe.probe(input);


        return this.json({
            isMobileReady,
            needsFastStart,
            lessThan780p
        });
    }

}
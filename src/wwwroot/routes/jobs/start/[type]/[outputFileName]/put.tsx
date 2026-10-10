import Page from "@entity-access/server-pages/dist/Page.js";
import { JobFolder } from "../../../../../../core/tempDiskCache.js";
import { Agent, Dispatcher, fetch } from "undici";
import globalEnv from "../../../../../../globalEnv.js";
import ServerLogger from "@entity-access/server-pages/dist/core/ServerLogger.js";
import { Route } from "@entity-access/server-pages/dist/core/Route.js";

let dispatcher: Dispatcher;

export default class extends Page {

    @Route
    type: string;

    @Route
    outputFileName: string;

    async run() {

        const { type, outputFileName } = this;

        console.log(JSON.stringify({
            job: type,
            outputFileName
        }));

        const job = await JobFolder.create();
        const output = job.get(outputFileName);

        const id = job.id;

        const jobInfo = {
            id,
            url: this.url,
            type,
            outputPath: output.path,
            outputFileName,
            status: `/jobs/${id}/status`,
            output: `/jobs/${id}/download/${outputFileName}`
        };

        dispatcher ??= new Agent(typeof globalEnv.port === "number"
            ? {
                connect: {
                    port: globalEnv.port
                }
            }
            : {
                socketPath: globalEnv.port
            }
        );

        const url = new URL(`http://localhost/convert/${type}/${outputFileName}`);
        for(const [k,v] of this.request.URL.searchParams.entries()) {
            url.searchParams.append(k, v);
        }
        url.searchParams.set("outputPath", jobInfo.outputPath);
        url.searchParams.set("keep", "yes");

        // fire and forget...
        fetch(url.toString(), {
            dispatcher
        }).catch(ServerLogger.error);


        await job.get("job.json").writeAllText(JSON.stringify(jobInfo));



        return this.json(jobInfo);

    }
}
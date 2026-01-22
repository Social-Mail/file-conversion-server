import { availableParallelism } from 'os';
import WebServer from './WebServer.js';
import ClusterInstance, { RecycledWorker } from "@entity-access/server-pages/dist/ClusterInstance.js";
import sleep from './core/sleep.js';

const numCPUs = process.env.SOCIAL_MAIL_CLUSTER_WORKERS
            ? Number(process.env.SOCIAL_MAIL_CLUSTER_WORKERS)
            : availableParallelism();

export default class WebCluster extends ClusterInstance<typeof WebServer> {
    protected async runPrimary(arg: typeof WebServer): Promise<void> {
        while(true) {
            const workers = [] as RecycledWorker[];
            console.log(`Creating cluster ${numCPUs} workers`);
            for (let index = 0; index < numCPUs; index++) {
                workers.push(this.fork({ port: 8081 }));
            }

            // sleep for 30 days
            for (let index = 0; index < 30; index++) {
                await sleep(24*60*60*1000);
            }

            for (const worker of workers) {
                worker.destroy();
            }
        }
    }
    protected async runWorker(arg: typeof WebServer): Promise<void> {
        console.log(`Worker started`);
        const ws = new arg();
        await ws.create();
    }

}
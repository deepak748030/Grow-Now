import cluster from "cluster";
import os from "os";
import { PORT, NUM_WORKERS } from "../services/config.js";
import app from "./server.js";

if (cluster.isPrimary) {
    const numCPUs = NUM_WORKERS === "auto" ? os.cpus().length : parseInt(NUM_WORKERS);

    console.log(`🔹 Master process running on PID ${process.pid}`);
    console.log(`🚀 Forking ${numCPUs} worker processes...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`❌ Worker ${worker.process.pid} died. Spawning a new worker...`);
        cluster.fork();
    });
} else {
    app.listen(PORT, () => {
        console.log(`✅ Worker ${process.pid} started - Listening on port ${PORT}`);
    });
}

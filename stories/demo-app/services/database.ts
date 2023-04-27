import runnable from "@/runnable";
import botox from "../botox";

export class DatabaseService {
    constructor(
        public connection: string,
    ) { }

    async query(q: any) {

    }
}

export namespace DatabaseService {

    @botox.container.service()
    export class RunArgFactory implements runnable.RunArgFactory {

        @botox.logging.decorators.debug(
            (log, r, p, loggers) => log('database connection produced for', p.args[0]),
            (log, e, p, loggers) => loggers.warn('failed to produce database connection for', p.args[0], e),
        )
        async produce_run_arg(r: botox.Api, connection: string){
            return new DatabaseService(connection);
        }

        @botox.logging.decorators.debug(
            (log, r, p, loggers) => log('database connection released for', p.args[0]),
            (log, e, p, loggers) => loggers.warn('failed to release database connection for', p.args[0], e),
        )
        async release_run_arg?(r: botox.Api) {
        }
    }
}
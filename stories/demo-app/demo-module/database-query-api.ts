import botox from "../botox";
import { DatabaseService } from "../services/database";

@botox.api().route('database_query')
export class DatabaseQueryApi implements botox.Api {


    @botox.api_arg().validatable({
        parser(v) { return `${v}` }
    })
    query: string;

    async run(
        @botox.run_arg(DatabaseService.RunArgFactory, 'db1') db: DatabaseService,
    ) {
        return db.query(this.query);
    }

}
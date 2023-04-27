import botox from "../botox";
import { DatabaseService } from "../services/database";
import { RequestContext } from "../services/request-context";

@RequestContext.codable('p')
class PurchaseCommand {

    arg1: string;

    arg2: number;

    [RequestContext.context]: RequestContext;

    run(
        @botox.run_arg(DatabaseService.RunArgFactory, 'my_db') db: DatabaseService,
    ) {

    }
}

@botox.api()
export class PurchasePrepare {

    @botox.api_arg()
    [RequestContext.context]: RequestContext;

    run() {
        let purchase = new PurchaseCommand();
        purchase.arg1 = '1';
        purchase.arg2 = 2;
        purchase[RequestContext.context] = this[RequestContext.context];

        return {
            purchase,
        }
    }
}

@botox.api()
export class PurchaseExecute {

    @botox.api_arg()
    [RequestContext.context]: RequestContext;

    @botox.api_arg()
    purchase: PurchaseCommand;

    run() {
        return {
            purchase: { ...this.purchase },
        }
    }
}

export default [
    PurchasePrepare,
    PurchaseExecute,
]
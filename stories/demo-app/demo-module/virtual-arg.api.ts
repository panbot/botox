import assert from "assert";
import botox from "../botox";

@botox.api()
export class VirtualArgApi implements botox.Api {

    @botox.api_arg().optional(true)
    arg1?: any;

    @botox.api_arg().optional(true)
    arg2?: any;

    @botox.api_arg().virtual(true).validatable({
        parser() {
            assert(this.arg1 ?? this.arg2, 'either arg1 or arg2 must be provided')
        }
    })
    coarg12: any;

    async run() {
    }
}

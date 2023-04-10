import runnable from "@/lib/runnable";
import botox from "../botox";

@botox.api()
export class VirtualArgApi implements runnable.Runnable {

    @botox.api_arg().optional(true)
    arg1?: any;

    @botox.api_arg().optional(true)
    arg2?: any;

    @botox.api_arg().virtual(true).validatable({
        parser: v => v,
        validator() { return this.validate() }
    })
    coarg12: any;

    async [runnable.run]() {
    }

    private validate() {
        return this.arg1 || this.arg2 ? undefined : 'either arg1 or arg2 must be provided';
    }
}
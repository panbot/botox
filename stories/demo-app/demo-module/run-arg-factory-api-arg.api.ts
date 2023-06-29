import runnable from "@/runnable";
import botox from "../botox";

class RunArgService implements runnable.RunArgFactory {

    constructor(arg: string) {

    }

    produce_run_arg(for_runnable: any) {
        return new RunArgService(RunArgService.arg.get_value(for_runnable));
    }
}

namespace RunArgService {
    export const arg = botox.create_run_arg_factory_api_arg();
}

@botox.api()
export class RunArgFactoryApiArgDemo {

    @botox.api_arg()
    @RunArgService.arg()
    arg: string;

    run(
        @botox.run_arg(RunArgService) service: RunArgService,
    ) {

    }
}

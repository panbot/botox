import assert from "assert";
import decorator from "../../lib/decorator";
import { Constructor } from "../../lib/types";
import { ApiOptions } from "./types";

export class ClassAsApiManager<Api, Options extends ApiOptions> {

    members = new Map<Constructor<Api>, Options>();

    constructor(
        public createCustomOptions: (target: Constructor<Api>) => Options,
    ) { }

    createDecorator() {
        return decorator<Constructor<Api>>()('class')(
            target => this.createOptions(target),
            target => this.getOptions(target)
        )
    }

    createOptions(target: Constructor<Api>) {
        let options = this.createCustomOptions(target);
        this.members.set(target, options);
        return options;
    }

    getOptions(target: Constructor<Api>) {
        let options = this.members.get(target);
        assert(options, `Api options for ${target.name} not found`);
        return options;
    }
}

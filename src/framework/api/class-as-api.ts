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
            target => this.makeOptions(target),
            target => this.findOptions(target)
        )
    }

    makeOptions(target: Constructor<Api>) {
        let options = this.createCustomOptions(target);
        this.members.set(target, options);
        return options;
    }

    findOptions(target: Constructor<Api>) {
        let options = this.members.get(target);
        assert(options, `Api options for ${target.name} not found`);
        return options;
    }
}

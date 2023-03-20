import assert from "node:assert";
import decorator from "../../lib/decorator";
import { Constructor } from "../../lib/types";
import { MapMap } from "../../lib/utils";
import { ApiOptions } from "./types";

export class MethodAsApiManager<Api extends {}, Options extends ApiOptions> {

    members = new MapMap<Constructor<Api>, PropertyKey, Options>();

    constructor(
        public createCustomOptions: (target: Constructor<Api>, property: PropertyKey) => Options,
    ) { }

    createDecorator() {
        return decorator<Api>()('method')(
            (target, property) => this.makeOptions(target.constructor as Constructor<any>, property),
            (target, property) => this.findOptions(target.constructor as Constructor<any>, property)
        )
    }

    makeOptions(target: Constructor<Api>, property: PropertyKey) {
        let options = this.createCustomOptions(target, property);
        this.members.set(target, property, options);
        return options;
    }

    findOptions(target: Constructor<Api>, property: PropertyKey) {
        let options = this.members.get(target, property);
        assert(options, `Api options not found for ${target.name}::${property.toString()}()`);
        return options;
    }
}

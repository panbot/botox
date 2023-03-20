import assert from "node:assert";
import decorator from "../../lib/decorator";
import { Constructor } from "../../lib/types";
import { ApiOptions } from "./types";

export class MethodAsApiManager<Api, Options extends ApiOptions> {

    members = new Map<Constructor<Api>, Map<PropertyKey, Options>>();

    constructor(
        public createCustomOptions: (target: Constructor<Api>, property: PropertyKey) => Options,
    ) { }

    createDecorator() {
        return decorator<Constructor<Api>>()('method')(
            (target, property) => this.createOptions(target, property),
            (target, property) => this.getOptions(target, property)
        )
    }

    createOptions(target: Constructor<Api>, property: PropertyKey) {
        let options = this.createCustomOptions(target, property);
        let properties = this.members.get(target);
        if (!properties) {
            properties = new Map<PropertyKey, Options>();
            this.members.set(target, properties);
        }
        properties.set(property, options);
        return options;
    }

    getOptions(target: Constructor<Api>, property: PropertyKey) {
        let properties = this.members.get(target);
        assert(properties, `Api options for ${target.name}::${property.toString()} not found`);
        let options = properties.get(property);
        assert(options, `Api options for ${target.name}::${property.toString()} not found`);
        return options;
    }
}

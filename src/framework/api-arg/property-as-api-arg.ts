import "reflect-metadata";
import assert from "node:assert";
import decorator from "../../lib/decorator";
import { Constructor } from "../../lib/types";
import { MapMap } from "../../lib/utils";
import { ApiArgOptions } from "./types";

export class PropertyAsApiArgs<Api extends {}> {

    members = new MapMap<Constructor<Api>, PropertyKey, ApiArgOptions>();

    createDecorator() {
        return decorator<Api>()('property')(
            (target, property) => this.makeOptions(target, property),
            (target, property) => this.findOptions(target.constructor as Constructor<Api>, property),
        )
    }

    makeOptions(target: Api, property: PropertyKey) {
        let options: ApiArgOptions = {
            type: Reflect.getMetadata('design:type', target, property as any),
        };
        this.members.set(target.constructor as Constructor<Api>, property, options);
        return options;
    }

    findOptions(target: Constructor<Api>, property: PropertyKey) {
        let options = this.members.get(target, property);
        assert(options, `ApiArgOptions not found for ${target.name}::${property.toString()}`);
        return options;
    }

}

import "reflect-metadata";
import assert from "node:assert";
import decorator from "../../lib/decorator";
import { Constructor } from "../../lib/types";
import { MapMapMap } from "../../lib/utils";
import { ApiArgOptions } from "./types";

export class ParameterAsApiArgs<Api extends {}> {

    members = new MapMapMap<Constructor<Api>, PropertyKey, number, ApiArgOptions>();

    createDecorator() {
        return decorator<Api>()('parameter')(
            (target, property, index) => this.makeOptions(target, property, index),
            (target, property, index) => this.findOptions(target.constructor as Constructor<Api>, property, index),
        )
    }

    makeOptions(target: Api, property: PropertyKey, index: number) {
        let options: ApiArgOptions = {
            type: Reflect.getMetadata('design:paramtypes', target, property as any)[index],
        };
        this.members.set(target.constructor as Constructor<Api>, property, index, options);
        return options;
    }

    findOptions(target: Constructor<Api>, property: PropertyKey, index: number) {
        let options = this.members.get(target, property, index);
        assert(options, `ApiArgOptions not found for ${target.name}::${property.toString()}`);
        return options;
    }

}

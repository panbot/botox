import "reflect-metadata";
import decorator from "../lib/decorator";
import { Constructor } from "../lib/types";
import { ValidatableOptions } from "./validatable";

export type ApiArgOptions = {
    doc: string,
    type: Constructor<any>,
    optional: boolean,
    default: any,
    priority: number,
    validatable: ValidatableOptions,
}

export default function<Api extends {}>() {
    return {

        propertyAsArg: () => decorator('property')<Api>()(
            (target, property) => ({
                type: Reflect.getMetadata('design:type', target, property as any),
            }) as ApiArgOptions
        ),

        parameterAsArg: () => decorator('parameter')<Api>()(
            (target, property, index) => ({
                type: Reflect.getMetadata('design:paramtypes', target, property as any)[index],
            }) as ApiArgOptions
        )
    }
}
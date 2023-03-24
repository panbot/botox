import "reflect-metadata";
import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import { CONSTRUCTOR } from "../lib/types";
import { Validatable } from "./validatable";

export type ApiArgOptions = {
    type: CONSTRUCTOR<any>,
    doc?: string,
    optional?: boolean,
    default?: any,
    priority?: number,
    validatable?: Validatable,
}

export default function<Api extends {}>() {

    const create = (
        getValidatable: (type: CONSTRUCTOR<any>) => Validatable<any> | undefined,
        type: any,
    ) => ({
        type,
        validatable: getValidatable(type),
    } as ApiArgOptions);

    return {

        propertyAsArg: (
            getValidatable: (type: CONSTRUCTOR<any>) => Validatable<any> | undefined,
        ) => decorator('property')<Api>()(
            (target, property) => create(
                getValidatable,
                Reflect.getMetadata('design:type', target, property as any)
            )
        )[expandify.expand](d => ({
            getArgs: <T extends Api>(api: T) => {
                let map = new Map<keyof T, ApiArgOptions>();
                d.getRegistry(api, '').forEachProperty((p, get) => map.set(p as keyof T, get()));
                return map;
            }
        })),

        parameterAsArg: (
            getValidatable: (type: CONSTRUCTOR<any>) => Validatable<any> | undefined,
        ) => decorator('parameter')<Api>()(
            (target, property, index) => create(
                getValidatable,
                Reflect.getMetadata('design:paramtypes', target, property as any)[index]
            )
        )
    }
}
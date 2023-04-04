import "reflect-metadata";
import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import types from './types';
import mr from "../lib/metadata-registry";

import OPTIONS = types.API_ARG_OPTIONS;

export namespace property_as_arg {

    export function factory(

    ) {
        return decorator.create_property_decorator.instance({
            init_by: (
                ctx,
                options?: OPTIONS
            ) => {
                return options || {} satisfies OPTIONS
            }
        })[expandify.expand]({

            for_each_arg(
                api: any,
                callback: (property: PropertyKey, arg: OPTIONS) => void,
            ) {
                this[mr.get_registry][mr.get_properties](api).for_each(
                    (p, gr) => callback(p, gr().get()!)
                )
            },
        })
    }

    export type API_ARG = ReturnType<typeof factory>;
}

export namespace parameter_as_arg {
    export function factory(

    ) {
        return decorator.create_parameter_decorator.instance_method({
            init_by: (
                ctx,
                options?: OPTIONS
            ) => {
                return options || {} satisfies OPTIONS
            }
        })[expandify.expand]({

            for_each_arg(
                api: any,
                property: PropertyKey,
                callback: (index: number, arg: OPTIONS) => void,
            ) {
                this[mr.get_registry](api, property).get()?.forEach(
                    (arg, index) => callback(index, arg)
                );
            }
        })
    }

    export type API_ARG = ReturnType<typeof factory>;
}

// export default function<Api extends {}>() {

//     const create = (
//         getValidatable: (type: CONSTRUCTOR<any>) => Validatable<any> | undefined,
//         type: any,
//     ) => ({
//         type,
//         validatable: getValidatable(type),
//     } as ApiArgOptions);

//     return {

//         propertyAsArg: (
//             getValidatable: (type: CONSTRUCTOR<any>) => Validatable<any> | undefined,
//         ) => decorator('property')<Api>()(
//             (target, property) => create(
//                 getValidatable,
//                 Reflect.getMetadata('design:type', target, property as any)
//             )
//         )[expandify.expand](d => ({
//             getArgs: <T extends Api>(api: T) => {
//                 let map = new Map<keyof T, ApiArgOptions>();
//                 d.getRegistry(api, '').forEachProperty((p, get) => map.set(p as keyof T, get()));
//                 return map;
//             }
//         })),

//         parameterAsArg: (
//             getValidatable: (type: CONSTRUCTOR<any>) => Validatable<any> | undefined,
//         ) => decorator('parameter')<Api>()(
//             (target, property, index) => create(
//                 getValidatable,
//                 Reflect.getMetadata('design:paramtypes', target, property as any)[index]
//             )
//         )
//     }
// }
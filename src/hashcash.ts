import { createHash } from "node:crypto";
import mr from "./metadata-registry";
import { typram } from "./types";

export namespace hashcash {
    export type OPTIONS = {
        algorithm: ALGORITHM,
        difficulty: number
    }

    export type ALGORITHM = string;
  }

function consume_hashcash(
    algorithm: hashcash.ALGORITHM,
    payload: string | Buffer,
    hashcash: string | Buffer,
) {
    let hex = createHash(algorithm).update(payload).update(hashcash).digest('hex');
    for (let i = 0; i < hex.length; ++i) if (hex.charAt(i) != '0') return i;
    return hex.length;
}

export default function(algorithm: hashcash.ALGORITHM = 'sha256') {

    const get_request_registry  = mr.class_factory(mr.create_key<{ zeros: number }>());
    const get_resource_registry = mr(typram<[ target: any, property?: any ]>())(false)(mr.create_key<{ difficulty: number }>())

    const decorator = (
        difficulty: number
    ) => (
        target: any, property?: any
    ) => void get_resource_registry(target, property).set({ difficulty });

    return {

        protect: decorator,

        get_resource_difficulty,

        get_provided_difficulty,
        set_provided_difficulty: (
            request: Object,
            zeros: number
        ) => get_request_registry(request).set({ zeros }),

        check: (
            request: Object,
            resource: Object,
            property?: PropertyKey,
        ) => {
            let required_difficulty = get_resource_difficulty(resource, property);
            let provided_difficulty = get_provided_difficulty(request);
            return provided_difficulty >= required_difficulty
        },

        consume_hashcash: (
            payload: string | Buffer,
            hashcash: string | Buffer,
        ) => consume_hashcash(algorithm, payload, hashcash),
    }

    function get_resource_difficulty(target: Object, property?: PropertyKey) {
        if (!property && typeof target != 'function') target = target.constructor;
        return get_resource_registry(target, property).get()?.difficulty ?? 0;
    }

    function get_provided_difficulty(request: Object) {
        return get_request_registry(request).get_own()?.zeros ?? 0
    }

}

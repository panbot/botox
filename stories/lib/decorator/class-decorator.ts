import decorator from "@/lib/decorator";
import mr from "@/lib/metadata-registry";
import { CONSTRUCTOR, IS } from "@/lib/types";
import * as asserts from "stories/asserts";

class Options {
    name?: string;
}

const class_decorator = decorator.create_class_decorator({
    init_by: (
        ctx,
        values?: Options,
    ) => {
        asserts.assert_true<IS<
            typeof ctx["args"] , [ CONSTRUCTOR<{}> ]
        >>();
        return Object.assign(new Options(), values);
    },
    target: decorator.target<{}>(),
});

asserts.assert_true<IS<
    Parameters<typeof class_decorator>[0] , Options | undefined
>>()

{
    type T = typeof class_decorator[typeof mr.get_registry];
    asserts.assert_true  <IS<Parameters<T>[0], CONSTRUCTOR<{}>>>();
    asserts.assert_false <IS<Parameters<T>[0], {}>>();
}

@class_decorator()
    .name('test target')
class Target {

}

class Target2 {

}

console.log(class_decorator[mr.get_registry](Target).get()?.name);

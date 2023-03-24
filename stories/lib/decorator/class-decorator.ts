import decorator from "@/lib/decorator";
import { CONSTRUCTOR, IS, typram } from "@/lib/types";
import { assert_of_type, assert_true } from "stories/assert";

class Options {

}

const dec = decorator.create_class_decorator({
    target: typram<{}>(),
    init_by: t => {
        assert_of_type<CONSTRUCTOR<{}>>(t)
        return new Options()
    }
})

assert_true<IS<Parameters<typeof dec["get_registry"]>[0], CONSTRUCTOR<{}>>>()
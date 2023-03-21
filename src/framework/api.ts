import decorator from "../lib/decorator";

export default function<Api extends {}>() {
    return {
        classAsApi  : decorator('class' )<Api>(),
        methodAsApi : decorator('method')<Api>(),
    }
}

import { join } from "path";
import botox from "./botox";

botox.invoke_api(get_api()).catch(e => console.trace(e));

function get_api() {
    let file_default_export = require(join(process.cwd(), process.argv[2] ?? usage())).default;
    if (typeof file_default_export != 'function') usage('file not runnable');
    let api = botox.container.instantiate(file_default_export);
    if (!botox.is_api(api)) usage('file not runnable');
    return api;
}

function usage(message?: string): never {
    if (message) console.error(message);
    console.error('usage: <path-to-file>');
    process.exit(1);
}
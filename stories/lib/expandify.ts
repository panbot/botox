import expandify from "@/lib/expandify";

let o = {};

let expandable = expandify(o);

console.log(o === expandable);

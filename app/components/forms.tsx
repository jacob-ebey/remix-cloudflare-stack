import { styledTag } from "./styled";

export let Label = styledTag("label", "block mt-2");

export let Input = styledTag(
  "input",
  "block border hover:border-black px-4 py-2 mt-2"
);

export let InputError = styledTag("span", "mt-2 text-red-500", undefined, {
  role: "alert",
});

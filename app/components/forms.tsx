import cn from "classnames";

import { styledTag } from "./styled";

export let Checkbox = styledTag<
  "input",
  {
    position?: "left" | "right";
  }
>(
  "input",
  "inline-block w-5 h-5",
  ({ position }) =>
    cn({
      "mr-2": !position || position === "left",
      "ml-2": position === "right",
    }),
  {
    type: "checkbox",
  }
);

export let CheckboxLabel = styledTag("label", "flex items-center mt-2");

export let Label = styledTag("label", "block mt-2");

export let Input = styledTag(
  "input",
  "block border hover:border-black px-4 py-2 mt-2"
);

export let InputError = styledTag("span", "mt-2 text-red-500", undefined, {
  role: "alert",
});

export let Textarea = styledTag(
  "textarea",
  "block border hover:border-black px-4 py-2 mt-2"
);

import React from "react";
import cn from "classnames";
import type { Argument } from "classnames";

type ComponentType =
  | keyof JSX.IntrinsicElements
  | React.JSXElementConstructor<any>;

type StyledTagProps<
  TDefaultTag extends ComponentType,
  TTag extends ComponentType = TDefaultTag
> = React.ComponentProps<TTag> & {
  tag?: ComponentType;
};

export function styledTag<TDefaultTag extends ComponentType, TExtraProps = {}>(
  defaultTag: TDefaultTag,
  baseClassName?: string,
  classNames?: (
    props: TExtraProps & StyledTagProps<TDefaultTag, TDefaultTag>
  ) => Argument,
  baseProps?: StyledTagProps<TDefaultTag, TDefaultTag>
) {
  function StyledTag<TTag extends ComponentType>(
    props: TExtraProps & StyledTagProps<TDefaultTag, TTag>,
    ref: any
  ) {
    const { tag, className, ...rest } = props as any;
    const Tag: any = tag || defaultTag;

    return (
      <Tag
        {...baseProps}
        {...rest}
        ref={ref}
        className={cn(baseClassName, classNames?.(props as any), className)}
      />
    );
  }

  return React.forwardRef(StyledTag);
}

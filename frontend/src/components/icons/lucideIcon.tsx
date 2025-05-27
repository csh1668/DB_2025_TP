import { icons } from "lucide-react";
import type { HTMLAttributes } from "react";

export interface LucideIconProps extends HTMLAttributes<HTMLOrSVGElement> {
    name: keyof typeof icons;
    size?: number;
}

export default function LucideIcon({ name, size = 24, ...props }: LucideIconProps) {
    const SelectedIcon = icons[name];

    return (
        <SelectedIcon size={size} className={props.className} {...props} />
    )
}
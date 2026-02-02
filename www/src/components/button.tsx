import { Link } from "react-router";

type ButtonVariant = "primary" | "secondary";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
}

interface ButtonAsButtonProps extends ButtonBaseProps {
  as?: "button";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

interface ButtonAsLinkProps extends ButtonBaseProps {
  as: "link";
  to: string;
}

interface ButtonAsAnchorProps extends ButtonBaseProps {
  as: "anchor";
  href: string;
  target?: string;
  rel?: string;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps | ButtonAsAnchorProps;

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-amber-500 text-amber-950 hover:bg-amber-400",
  secondary: "bg-neutral-700 text-neutral-50 hover:bg-neutral-600",
};

const baseStyles = "px-4 py-2 font-medium cursor-pointer transition-colors";

export function Button(props: ButtonProps) {
  const { variant = "primary", children, className = "" } = props;
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`.trim();

  if (props.as === "link") {
    return (
      <Link to={props.to} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  if (props.as === "anchor") {
    return (
      <a href={props.href} target={props.target} rel={props.rel} className={combinedClassName}>
        {children}
      </a>
    );
  }

  return (
    <button type={props.type ?? "button"} onClick={props.onClick} className={combinedClassName}>
      {children}
    </button>
  );
}

import clsx from "clsx";

interface ImageProps {
  url: string;
  alt?: string;
  ariaLabel?: string;
  className?: string;
  onClick?: () => void;
}

function Image({ url, alt, ariaLabel, className, onClick }: ImageProps) {
  return (
    <img
      src={url}
      alt={alt}
      aria-label={ariaLabel}
      className={clsx("rounded-xl", className)}
      onClick={() => onClick?.()}
    />
  );
}

export default Image;

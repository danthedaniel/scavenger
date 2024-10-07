interface ImageProps {
  url: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

function Image({ url, alt, className, onClick }: ImageProps) {
  return (
    <img
      src={url}
      alt={alt}
      className={`rounded-xl ${className}`}
      onClick={() => onClick?.()}
    />
  );
}

export default Image;

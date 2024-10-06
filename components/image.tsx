interface ImageProps {
  url: string;
  alt: string;
  className?: string;
}

function Image({ url, alt, className }: ImageProps) {
  return <img src={url} alt={alt} className={`rounded-xl ${className}`} />;
}

export default Image;

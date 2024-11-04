function paragraphs(text: string, className?: string) {
  return text.split("\n").map((line) => (
    <p key={line} className={className}>
      {line}
    </p>
  ));
}

export default paragraphs;

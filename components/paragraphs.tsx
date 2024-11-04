function paragraphs(text: string) {
  return text.split("\n").map((line) => (
    <p key={line} className="mb-4 text-lg">
      {line}
    </p>
  ));
}

export default paragraphs;

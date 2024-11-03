function paragraphs(text: string) {
  return text.split("\n").map((line) => (
    <p key={line} className="text-lg mb-4">
      {line}
    </p>
  ));
}

export default paragraphs;

const adjectives = ['awesome', 'fantastic', 'amazing', 'cool', 'brilliant'];
const nouns = ['project', 'repo', 'work', 'code', 'app'];

export default function generateRandomFileName() {
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 100);

  return `${randomAdjective}-${randomNoun}-${randomNumber}`;
}

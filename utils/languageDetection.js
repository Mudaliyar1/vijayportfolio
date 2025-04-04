/**
 * Advanced language detection utility
 * Detects multiple languages including mixed language inputs
 */

// Language patterns for detection based on script
const languagePatterns = {
  hindi: /[अ-ह]/,
  tamil: /[அ-ஔ]|[க-ஹ]|[ா-்]/,
  english: /^[A-Za-z0-9\s.,!?;:'"\-()]+$/,
  spanish: /[áéíóúüñ¿¡]/i,
  french: /[àâäæçéèêëîïôœùûüÿ]/i,
  // Add more languages as needed
};

// Common Hindi/Hinglish words in Latin script
const hindiWords = [
  'kya', 'hai', 'main', 'tum', 'aap', 'mujhe', 'hum', 'yeh', 'woh', 'kaise',
  'kyun', 'kahan', 'kab', 'kaun', 'kitna', 'bahut', 'thoda', 'accha', 'bura',
  'nahi', 'haan', 'lekin', 'par', 'aur', 'ya', 'ki', 'ko', 'se', 'me', 'pe',
  'rahe', 'raha', 'rahi', 'kar', 'karo', 'karenge', 'karoge', 'karunga',
  'namaste', 'dhanyavaad', 'shukriya', 'theek', 'achha', 'bhai', 'didi',
  'kaise', 'kaisa', 'kaisi', 'kya', 'kyun', 'kyon', 'matlab', 'samajh',
  'samjha', 'batao', 'bolo', 'suno', 'dekho', 'jao', 'aao', 'karo'
];

// Common Tamil words in Latin script
const tamilLatinWords = [
  'naan', 'neenga', 'enna', 'epdi', 'inge', 'ange', 'romba', 'konjam',
  'vanakkam', 'nandri', 'illai', 'aama', 'seri', 'ponga', 'vaanga',
  'eppadi', 'enakku', 'unakku', 'avanga', 'ivanga', 'oru', 'rendu', 'moonu',
  'naalu', 'sollunga', 'parunga', 'kelvi', 'pathil', 'theriyum', 'theriyathu',
  'pudikkum', 'pudikkathu', 'vendum', 'vendaam', 'irukku', 'illai'
];

// Common Spanish words
const spanishWords = [
  'hola', 'gracias', 'buenos', 'días', 'tardes', 'noches', 'como', 'estás',
  'bien', 'mal', 'adios', 'hasta', 'luego', 'mañana', 'por', 'favor', 'de', 'nada',
  'si', 'no', 'que', 'quien', 'donde', 'cuando', 'porque', 'como', 'cuanto'
];

// Common French words
const frenchWords = [
  'bonjour', 'merci', 'au revoir', 'salut', 'oui', 'non', 'comment', 'ça', 'va',
  'bien', 'mal', 's\'il', 'vous', 'plaît', 'de', 'rien', 'je', 'tu', 'il', 'elle',
  'nous', 'vous', 'ils', 'elles', 'suis', 'es', 'est', 'sommes', 'êtes', 'sont'
];

/**
 * Detect the language of a given text
 * @param {string} text - The text to analyze
 * @returns {Object} - The detected language information
 */
function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return { primary: 'english', confidence: 1.0, mixed: false }; // Default for empty input
  }

  // Initialize language scores
  const scores = {
    english: 0,
    hindi: 0,
    tamil: 0,
    spanish: 0,
    french: 0
  };

  // Check for script-based patterns
  if (languagePatterns.hindi.test(text)) {
    scores.hindi += 2; // Strong indicator
  }

  if (languagePatterns.tamil.test(text)) {
    scores.tamil += 2; // Strong indicator
  }

  if (languagePatterns.spanish.test(text)) {
    scores.spanish += 1; // Medium indicator
  }

  if (languagePatterns.french.test(text)) {
    scores.french += 1; // Medium indicator
  }

  // For Latin script, check for language-specific words
  const words = text.toLowerCase().split(/\s+/);
  const totalWords = words.length;

  // Count words from each language
  const hindiWordCount = words.filter(word => hindiWords.includes(word)).length;
  const tamilWordCount = words.filter(word => tamilLatinWords.includes(word)).length;
  const spanishWordCount = words.filter(word => spanishWords.includes(word)).length;
  const frenchWordCount = words.filter(word => frenchWords.includes(word)).length;

  // Calculate scores based on word percentages
  if (totalWords > 0) {
    scores.hindi += (hindiWordCount / totalWords) * 3;
    scores.tamil += (tamilWordCount / totalWords) * 3;
    scores.spanish += (spanishWordCount / totalWords) * 3;
    scores.french += (frenchWordCount / totalWords) * 3;
  }

  // If text passes the English pattern test and has few foreign words, it's likely English
  if (languagePatterns.english.test(text) &&
      (hindiWordCount + tamilWordCount + spanishWordCount + frenchWordCount) / totalWords < 0.3) {
    scores.english += 2;
  }

  // Default English score if no other language is strongly detected
  if (Object.values(scores).every(score => score < 1)) {
    scores.english = 1;
  }

  // Find the language with the highest score
  let primaryLanguage = 'english';
  let highestScore = scores.english;

  for (const [language, score] of Object.entries(scores)) {
    if (score > highestScore) {
      primaryLanguage = language;
      highestScore = score;
    }
  }

  // Check if it's a mixed language input
  const secondHighestScore = Object.entries(scores)
    .filter(([lang]) => lang !== primaryLanguage)
    .reduce((max, [lang, score]) => score > max.score ? {lang, score} : max, {lang: null, score: 0});

  const isMixed = secondHighestScore.score > 0 && secondHighestScore.score / highestScore > 0.4;

  // Calculate confidence
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const confidence = totalScore > 0 ? highestScore / totalScore : 1;

  return {
    primary: primaryLanguage,
    secondary: isMixed ? secondHighestScore.lang : null,
    confidence: confidence,
    mixed: isMixed,
    scores: scores // Include all scores for debugging
  };
}

module.exports = { detectLanguage };

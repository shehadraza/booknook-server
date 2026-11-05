
import "dotenv/config";
import dns from "node:dns";
import { MongoClient } from "mongodb";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const OWNER = {
  ownerId: "booknook-library",
  ownerEmail: "library@booknook.com",
  ownerName: "BookNook Library",
};

const books = [
  // FICTION
  { title: "Pride and Prejudice", author: "Jane Austen", category: "Fiction", totalCopies: 4, rating: 5, description: "Elizabeth Bennet and Mr Darcy discover how first impressions can hide a person's true character." },
  { title: "Jane Eyre", author: "Charlotte Bronte", category: "Fiction", totalCopies: 3, rating: 5, description: "An independent young woman searches for belonging, love and dignity in Victorian England." },
  { title: "Wuthering Heights", author: "Emily Bronte", category: "Fiction", totalCopies: 3, rating: 4, description: "A powerful tale of passion, revenge and family conflict on the Yorkshire moors." },
  { title: "Great Expectations", author: "Charles Dickens", category: "Fiction", totalCopies: 4, rating: 5, description: "Pip's journey from a poor childhood to unexpected wealth changes how he sees loyalty and ambition." },
  { title: "Oliver Twist", author: "Charles Dickens", category: "Fiction", totalCopies: 3, rating: 4, description: "An orphan searches for kindness and safety in the harsh streets of nineteenth-century London." },
  { title: "Frankenstein", author: "Mary Shelley", category: "Fiction", totalCopies: 4, rating: 5, description: "A scientist creates life and faces the consequences of abandoning his extraordinary creation." },
  { title: "Dracula", author: "Bram Stoker", category: "Fiction", totalCopies: 3, rating: 5, description: "Letters and diary entries tell the chilling story of a mysterious vampire from Transylvania." },
  { title: "The Picture of Dorian Gray", author: "Oscar Wilde", category: "Fiction", totalCopies: 3, rating: 5, description: "A beautiful young man remains unchanged while a portrait reveals the cost of his choices." },
  { title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", category: "Fiction", totalCopies: 5, rating: 5, description: "Sherlock Holmes and Dr Watson solve curious mysteries through observation and deduction." },
  { title: "The Count of Monte Cristo", author: "Alexandre Dumas", category: "Fiction", totalCopies: 3, rating: 5, description: "A betrayed sailor escapes prison and plans an elaborate journey of justice and revenge." },

  // SCIENCE
  { title: "On the Origin of Species", author: "Charles Darwin", category: "Science", totalCopies: 3, rating: 5, description: "Darwin presents the theory of evolution by natural selection and its implications for life." },
  { title: "The Chemical History of a Candle", author: "Michael Faraday", category: "Science", totalCopies: 3, rating: 5, description: "A famous series of lectures uses a candle to explain chemistry and physical science." },
  { title: "Relativity", author: "Albert Einstein", category: "Science", totalCopies: 3, rating: 4, description: "Einstein introduces the central ideas of special and general relativity for general readers." },
  { title: "The Descent of Man", author: "Charles Darwin", category: "Science", totalCopies: 2, rating: 4, description: "Darwin examines human evolution, variation and the place of people in the natural world." },
  { title: "The Expression of the Emotions", author: "Charles Darwin", category: "Science", totalCopies: 2, rating: 4, description: "A pioneering study of how emotions are expressed in humans and other animals." },
  { title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", totalCopies: 4, rating: 5, description: "An accessible introduction to the universe, black holes, time and cosmology." },
  { title: "The Story of the Heavens", author: "Robert Stawell Ball", category: "Science", totalCopies: 2, rating: 4, description: "A richly explained introduction to astronomy and the wonders of the night sky." },
  { title: "The Voyage of the Beagle", author: "Charles Darwin", category: "Science", totalCopies: 2, rating: 4, description: "Darwin's travel journal records observations of nature during his famous scientific voyage." },
  { title: "The World of the Atom", author: "Henry A. Boorse", category: "Science", totalCopies: 2, rating: 4, description: "An introduction to the development of atomic ideas and the structure of matter." },
  { title: "The Meaning of Relativity", author: "Albert Einstein", category: "Science", totalCopies: 2, rating: 4, description: "Einstein explains the mathematical foundations and physical meaning of relativity." },

  // HISTORY
  { title: "The Histories", author: "Herodotus", category: "History", totalCopies: 3, rating: 5, description: "Herodotus records the cultures, journeys and conflicts of the ancient Mediterranean world." },
  { title: "The Peloponnesian War", author: "Thucydides", category: "History", totalCopies: 2, rating: 5, description: "A detailed account of the conflict between Athens and Sparta in ancient Greece." },
  { title: "The Decline and Fall of the Roman Empire", author: "Edward Gibbon", category: "History", totalCopies: 2, rating: 4, description: "A landmark historical study of the transformation and fall of the Roman Empire." },
  { title: "The Gallic War", author: "Julius Caesar", category: "History", totalCopies: 3, rating: 4, description: "Caesar's first-hand account of his military campaigns in Gaul." },
  { title: "The Prince", author: "Niccolo Machiavelli", category: "History", totalCopies: 4, rating: 5, description: "A classic examination of political power, leadership and statecraft." },
  { title: "The Art of War", author: "Sun Tzu", category: "History", totalCopies: 4, rating: 5, description: "An influential guide to strategy, preparation and understanding conflict." },
  { title: "The Story of the World", author: "M. B. Synge", category: "History", totalCopies: 2, rating: 4, description: "A broad narrative introduction to major events and civilizations in world history." },
  { title: "The Federalist Papers", author: "Alexander Hamilton", category: "History", totalCopies: 2, rating: 4, description: "Essays explaining the ideas and arguments behind the United States Constitution." },
  { title: "The Civilization of the Renaissance in Italy", author: "Jacob Burckhardt", category: "History", totalCopies: 2, rating: 4, description: "A classic study of culture, art and society in Renaissance Italy." },
  { title: "The Ancient City", author: "Numa Denis Fustel de Coulanges", category: "History", totalCopies: 2, rating: 4, description: "An exploration of religious beliefs and institutions in ancient Greek and Roman cities." },

  // KIDS
  { title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", category: "Kids", totalCopies: 5, rating: 5, description: "Alice follows a white rabbit into a whimsical world of curious characters and adventures." },
  { title: "The Wonderful Wizard of Oz", author: "L. Frank Baum", category: "Kids", totalCopies: 4, rating: 5, description: "Dorothy and her friends travel along the yellow brick road in search of the Wizard." },
  { title: "The Jungle Book", author: "Rudyard Kipling", category: "Kids", totalCopies: 4, rating: 5, description: "Mowgli grows up in the jungle among wolves, Baloo and Bagheera." },
  { title: "Peter Pan", author: "J. M. Barrie", category: "Kids", totalCopies: 4, rating: 5, description: "Peter Pan takes Wendy and her brothers to the magical island of Neverland." },
  { title: "The Secret Garden", author: "Frances Hodgson Burnett", category: "Kids", totalCopies: 4, rating: 5, description: "A lonely girl discovers a hidden garden that transforms the lives of everyone around it." },
  { title: "The Wind in the Willows", author: "Kenneth Grahame", category: "Kids", totalCopies: 3, rating: 5, description: "Mole, Rat, Badger and Toad share gentle adventures along the riverbank." },
  { title: "Black Beauty", author: "Anna Sewell", category: "Kids", totalCopies: 3, rating: 4, description: "A horse tells the story of his life and the kindness or cruelty he encounters." },
  { title: "The Railway Children", author: "E. Nesbit", category: "Kids", totalCopies: 3, rating: 4, description: "Three siblings build a new life near a railway after their family faces hardship." },
  { title: "Heidi", author: "Johanna Spyri", category: "Kids", totalCopies: 3, rating: 5, description: "A cheerful young girl finds friendship and happiness in the Swiss Alps." },
  { title: "The Adventures of Tom Sawyer", author: "Mark Twain", category: "Kids", totalCopies: 4, rating: 5, description: "Tom Sawyer turns ordinary days into adventures along the Mississippi River." },

  // OTHERS
  { title: "Meditations", author: "Marcus Aurelius", category: "Others", totalCopies: 4, rating: 5, description: "Personal reflections on discipline, responsibility and keeping a steady mind." },
  { title: "The Republic", author: "Plato", category: "Others", totalCopies: 3, rating: 5, description: "A philosophical dialogue exploring justice, education and the ideal society." },
  { title: "The Problems of Philosophy", author: "Bertrand Russell", category: "Others", totalCopies: 3, rating: 4, description: "A clear introduction to major philosophical questions about knowledge and reality." },
  { title: "Self-Reliance and Other Essays", author: "Ralph Waldo Emerson", category: "Others", totalCopies: 3, rating: 4, description: "Essays encouraging independent thought, confidence and a close relationship with nature." },
  { title: "Walden", author: "Henry David Thoreau", category: "Others", totalCopies: 3, rating: 4, description: "Thoreau reflects on simple living, nature and personal freedom beside Walden Pond." },
  { title: "The Art of Public Speaking", author: "Dale Carnegie", category: "Others", totalCopies: 3, rating: 4, description: "Practical guidance for preparing talks and communicating ideas with confidence." },
  { title: "The Theory of the Leisure Class", author: "Thorstein Veblen", category: "Others", totalCopies: 2, rating: 4, description: "A classic social critique of status, consumption and economic behavior." },
  { title: "The Practice of Management", author: "Peter F. Drucker", category: "Others", totalCopies: 3, rating: 5, description: "Foundational ideas about management, organizations and effective business leadership." },
  { title: "The Souls of Black Folk", author: "W. E. B. Du Bois", category: "Others", totalCopies: 2, rating: 5, description: "A landmark collection of essays on identity, society and history." },
  { title: "The Autobiography of Benjamin Franklin", author: "Benjamin Franklin", category: "Others", totalCopies: 3, rating: 4, description: "Franklin reflects on learning, work, public service and the making of his character." },
];

const palettes = [
  ["#17324d", "#081522", "#e8ad65"],
  ["#365b50", "#102b27", "#e6c58b"],
  ["#6b3542", "#2a1420", "#e8b77d"],
  ["#594b78", "#211b3b", "#e6c58b"],
  ["#8a5a2b", "#352016", "#f0c77d"],
  ["#28566a", "#102a3b", "#e7b36b"],
  ["#6c6740", "#292b1b", "#e9d59a"],
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function splitTitle(title, maxLength = 17) {
  const words = title.split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (candidate.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines.slice(0, 4);
}


function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function findRealCover(book) {
  const params = new URLSearchParams({
    title: book.title,
    author: book.author,
    fields: "title,author_name,cover_i",
    limit: "10",
  });

  const response = await fetch(
    `https://openlibrary.org/search.json?${params}`,
    {
      headers: {
        "User-Agent": "BookNookSeed/1.0 (library@booknook.com)",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Open Library search failed: ${response.status}`);
  }

  const data = await response.json();

  const expectedTitle = normalize(book.title);
  const expectedAuthor = normalize(book.author);
  const authorSurname = expectedAuthor.split(" ").pop();

  const match = (data.docs || []).find((item) => {
    const titleMatches = normalize(item.title) === expectedTitle;

    const authorMatches = (item.author_name || []).some((name) => {
      const normalizedAuthor = normalize(name);

      return (
        normalizedAuthor === expectedAuthor ||
        normalizedAuthor.includes(authorSurname)
      );
    });

    return titleMatches && authorMatches && item.cover_i;
  });

  if (!match) return null;

  return `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const client = new MongoClient(process.env.MONGODB_URI);




async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from the server .env file.");
  }

  try {
    await client.connect();

    const collection = client.db("booknook").collection("books");

    console.log("Starting real book cover update...");

    let updated = 0;
    let notFound = 0;
    let failed = 0;

    for (const book of books) {
      try {
        const image = await findRealCover(book);

        if (!image) {
          console.log(`NOT FOUND: ${book.title}`);
          notFound++;
          await delay(1100);
          continue;
        }

        const result = await collection.updateOne(
          {
            ownerId: OWNER.ownerId,
            title: book.title,
            author: book.author,
          },
          {
            $set: {
              image,
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount > 0) {
          console.log(`UPDATED: ${book.title}`);
          updated++;
        } else {
          console.log(`BOOK NOT FOUND IN DATABASE: ${book.title}`);
          notFound++;
        }
      } catch (error) {
        console.error(`FAILED: ${book.title}`, error.message);
        failed++;
      }

      // Respect Open Library's API rate limits.
      await delay(1100);
    }

    console.log("\n================================");
    console.log("BOOKNOOK COVER UPDATE COMPLETED");
    console.log(`Updated: ${updated}`);
    console.log(`Not found: ${notFound}`);
    console.log(`Failed: ${failed}`);
    console.log("================================");
  } catch (error) {
    console.error("Cover update failed:", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

seed();





import { verifyJWT } from "./auth.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import dns from "node:dns";

// Load environment variables
dotenv.config();

// DNS configuration for local development
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing. Check your .env file.");
  process.exit(1);
}

// Middleware
app.use(cors());

app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

let db;

// Connect to MongoDB and create indexes before starting the server
async function connectDB() {
  await client.connect();

  db = client.db("booknook");

  await db.command({ ping: 1 });

  // Books collection indexes
  await db.collection("books").createIndex({ createdAt: -1 });
  await db.collection("books").createIndex({ ownerEmail: 1 });

  // Borrows collection indexes
  await db.collection("borrows").createIndex({ userEmail: 1 });
  await db.collection("borrows").createIndex({ bookId: 1 });

  // Prevent the same user from having duplicate active borrows
  await db.collection("borrows").createIndex(
    { bookId: 1, userEmail: 1 },
    {
      unique: true,
      partialFilterExpression: {
        status: "active",
      },
    }
  );

  console.log("MongoDB Connected Successfully!");
  console.log("BookNook Collections and Indexes Ready!");
}

// --------------------------------------------------
// ROOT ROUTE
// --------------------------------------------------

app.get("/", (req, res) => {
  res.send("BookNook Server is Running!");
});

// --------------------------------------------------
// API 1: GET ALL BOOKS (PUBLIC)
// --------------------------------------------------

app.get("/books", async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      page = 1,
      limit = 12,
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(50, Math.max(1, Number(limit) || 12));

    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (req.query.ownerEmail) {
  filter.ownerEmail = String(req.query.ownerEmail);
}
if (req.query.ownerEmail) {
  filter.ownerEmail = String(req.query.ownerEmail);
}

    if (search) {
      // Escape special regex characters supplied by the user
      const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { author: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const booksCollection = db.collection("books");

    const totalBooks = await booksCollection.countDocuments(filter);

    const books = await booksCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit)
      .toArray();

    res.status(200).json({
      success: true,
      totalBooks,
      currentPage,
      totalPages: Math.ceil(totalBooks / pageLimit),
      books,
    });
  } catch (error) {
    console.error("Get Books Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve books",
    });
  }
});

// --------------------------------------------------
// API 2: GET SINGLE BOOK DETAILS (PROTECTED)
// --------------------------------------------------

app.get("/books/:id", verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await db.collection("books").findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    console.error("Get Single Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve book details",
    });
  }
});

// --------------------------------------------------
// API 3: ADD A NEW BOOK (PROTECTED)
// --------------------------------------------------

app.post("/books", verifyJWT, async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      description,
      image,
      totalCopies,
      rating,
    } = req.body;

    // Required field validation
    if (
      typeof title !== "string" ||
      typeof author !== "string" ||
      typeof category !== "string" ||
      typeof description !== "string" ||
      typeof image !== "string" ||
      totalCopies === undefined ||
      !title.trim() ||
      !author.trim() ||
      !category.trim() ||
      !description.trim() ||
      !image.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required book information",
      });
    }

    const copies = Number(totalCopies);

    if (!Number.isInteger(copies) || copies < 1) {
      return res.status(400).json({
        success: false,
        message: "Total copies must be a positive whole number",
      });
    }

    const bookRating = rating === undefined ? 0 : Number(rating);

    if (!Number.isFinite(bookRating) || bookRating < 0 || bookRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 0 and 5",
      });
    }

    const book = {
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      description: description.trim(),
      image: image.trim(),
      totalCopies: copies,
      availableCopies: copies,
      rating: bookRating,

      // Owner information comes only from the verified JWT
      ownerId: req.user.id,
      ownerEmail: req.user.email,
      ownerName: req.user.name,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("books").insertOne(book);

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Add Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add book",
    });
  }
});

// --------------------------------------------------
// API 4: UPDATE BOOK INFORMATION (PROTECTED)
// --------------------------------------------------

app.patch("/books/:id", verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const allowedFields = [
      "title",
      "author",
      "category",
      "description",
      "image",
      "totalCopies",
      "rating",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Validate text fields
    for (const field of [
      "title",
      "author",
      "category",
      "description",
      "image",
    ]) {
      if (updates[field] !== undefined) {
        if (
          typeof updates[field] !== "string" ||
          !updates[field].trim()
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a non-empty string`,
          });
        }

        updates[field] = updates[field].trim();
      }
    }

    const booksCollection = db.collection("books");

    const existingBook = await booksCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (existingBook.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own books",
      });
    }

    // Validate total copies without changing active borrow counts
    if (updates.totalCopies !== undefined) {
      const newTotal = Number(updates.totalCopies);

      if (!Number.isInteger(newTotal) || newTotal < 1) {
        return res.status(400).json({
          success: false,
          message: "Total copies must be a positive whole number",
        });
      }

      const borrowedCopies =
        existingBook.totalCopies - existingBook.availableCopies;

      if (newTotal < borrowedCopies) {
        return res.status(400).json({
          success: false,
          message:
            "Total copies cannot be less than currently borrowed copies",
        });
      }

      updates.totalCopies = newTotal;
      updates.availableCopies = newTotal - borrowedCopies;
    }

    if (updates.rating !== undefined) {
      const newRating = Number(updates.rating);

      if (!Number.isFinite(newRating) || newRating < 0 || newRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 0 and 5",
        });
      }

      updates.rating = newRating;
    }

    updates.updatedAt = new Date();

    const result = await booksCollection.updateOne(
      {
        _id: new ObjectId(id),
        ownerId: req.user.id,
      },
      {
        $set: updates,
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found or you are not the owner",
      });
    }

    const updatedBook = await booksCollection.findOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      book: updatedBook,
    });
  } catch (error) {
    console.error("Update Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update book",
    });
  }
});

// --------------------------------------------------
// API 5: DELETE A BOOK (PROTECTED)
// --------------------------------------------------

app.delete("/books/:id", verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const booksCollection = db.collection("books");
    const borrowsCollection = db.collection("borrows");

    const book = await booksCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own books",
      });
    }

    const activeBorrows = await borrowsCollection.countDocuments({
      bookId: id,
      status: "active",
    });

    if (activeBorrows > 0) {
      return res.status(409).json({
        success: false,
        message: "This book cannot be deleted while copies are borrowed",
      });
    }

    const result = await booksCollection.deleteOne({
      _id: new ObjectId(id),
      ownerId: req.user.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found or already deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Delete Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete book",
    });
  }
});

// --------------------------------------------------
// API 6: BORROW A BOOK (PROTECTED, TRANSACTION)
// --------------------------------------------------

app.post("/borrows", verifyJWT, async (req, res) => {
  const { bookId } = req.body;

  if (!bookId || !ObjectId.isValid(bookId)) {
    return res.status(400).json({
      success: false,
      message: "Valid book ID is required",
    });
  }

  const session = client.startSession();

  try {
    const booksCollection = db.collection("books");
    const borrowsCollection = db.collection("borrows");

    let borrowId = null;

    await session.withTransaction(async () => {
      // Find the book
      const book = await booksCollection.findOne(
        { _id: new ObjectId(bookId) },
        { session }
      );

      if (!book) {
        const error = new Error("Book not found");
        error.statusCode = 404;
        throw error;
      }

      // Prevent users from borrowing their own books
      if (book.ownerId === req.user.id) {
        const error = new Error("You cannot borrow your own book");
        error.statusCode = 403;
        throw error;
      }

      // Check existing active borrow
      const existingBorrow = await borrowsCollection.findOne(
        {
          bookId,
          userEmail: req.user.email,
          status: "active",
        },
        { session }
      );

      if (existingBorrow) {
        const error = new Error("You have already borrowed this book");
        error.statusCode = 409;
        throw error;
      }

      // Atomically reserve one available copy
      const reservation = await booksCollection.updateOne(
        {
          _id: new ObjectId(bookId),
          availableCopies: { $gt: 0 },
        },
        {
          $inc: { availableCopies: -1 },
        },
        { session }
      );

      if (reservation.modifiedCount === 0) {
        const error = new Error("No copies are currently available");
        error.statusCode = 409;
        throw error;
      }

      // Create borrow record
           const borrowRecord = {
        bookId,
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookImage: book.image,
        borrowedAt: new Date(),
        status: "active",

        // Copies at the moment of borrowing
        totalCopies: book.totalCopies,
        copiesBefore: book.availableCopies,
        copiesAfter: book.availableCopies - 1,

        // Return date: 14 days after borrowing
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      };

      const result = await borrowsCollection.insertOne(
        borrowRecord,
        { session }
      );

      borrowId = result.insertedId;
    });

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      borrowId,
    });
  } catch (error) {
    console.error("Borrow Book Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already borrowed this book",
      });
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to borrow book",
    });
  } finally {
    await session.endSession();
  }
});

// --------------------------------------------------
// API 7: GET CURRENT USER'S BORROWED BOOKS (PROTECTED)
// --------------------------------------------------

app.get("/borrows", verifyJWT, async (req, res) => {
  try {
    const borrows = await db
      .collection("borrows")
      .find({
        userEmail: req.user.email,
      })
      .sort({
        borrowedAt: -1,
      })
      .toArray();

    res.status(200).json({
      success: true,
      totalBorrows: borrows.length,
      borrows,
    });
  } catch (error) {
    console.error("Get Borrowed Books Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve borrowed books",
    });
  }
});

// --------------------------------------------------
// API 8: RETURN A BORROWED BOOK (PROTECTED, TRANSACTION)
// --------------------------------------------------

app.delete("/borrows/:id", verifyJWT, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid borrow ID",
    });
  }

  const session = client.startSession();

  try {
    const borrowsCollection = db.collection("borrows");
    const booksCollection = db.collection("books");

    await session.withTransaction(async () => {
      // Find this user's active borrow
      const borrow = await borrowsCollection.findOne(
        {
          _id: new ObjectId(id),
          userEmail: req.user.email,
          status: "active",
        },
        { session }
      );

      if (!borrow) {
        const error = new Error("Active borrow record not found");
        error.statusCode = 404;
        throw error;
      }

      // Increase available copies
      const bookUpdate = await booksCollection.updateOne(
        {
          _id: new ObjectId(borrow.bookId),
        },
        {
          $inc: {
            availableCopies: 1,
          },
        },
        { session }
      );

      if (bookUpdate.matchedCount === 0) {
        const error = new Error("Book record not found");
        error.statusCode = 404;
        throw error;
      }

      // Mark borrow as returned
      const borrowUpdate = await borrowsCollection.updateOne(
        {
          _id: new ObjectId(id),
          userEmail: req.user.email,
          status: "active",
        },
        {
          $set: {
            status: "returned",
            returnedAt: new Date(),
          },
        },
        { session }
      );

      if (borrowUpdate.modifiedCount === 0) {
        const error = new Error("Borrow record could not be updated");
        error.statusCode = 409;
        throw error;
      }
    });

    res.status(200).json({
      success: true,
      message: "Book returned successfully",
    });
  } catch (error) {
    console.error("Return Book Error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to return book",
    });
  } finally {
    await session.endSession();
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`BookNook Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server Error:", error.message);
    await client.close().catch(() => {});
    process.exit(1);
  }
}

startServer();

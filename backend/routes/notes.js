const express = require("express");
const fetchuser = require("../middleware/fetchuser");
const router = express.Router();
const Note = require("../models/Note");
const { body, validationResult } = require("express-validator");

// ROUTE: 1 - Fetch all notes using: GET "/api/notes/fetchallnotes".login required
router.get("/fetchallnotes", fetchuser, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id });
    res.json(notes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server error");
  }
});

// ROUTE: 2 - Add notes using: POST "/api/notes/addnote".login required
router.post(
  "/addnote",
  fetchuser,
  [
    body("title", "Title length must be atleast three characters").isLength({
      min: 3,
    }),
    body(
      "description",
      "description length must be atleast five characters"
    ).isLength({ min: 5 }),
  ],
  async (req, res) => {
    try {
      const { title, description, tag } = req.body;

      // if there are errors, return bad request and the errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const note = new Note({
        title,
        description,
        tag,
        user: req.user.id,
      });

      const savaedNote = await note.save();

      res.json(savaedNote);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server error");
    }
  }
);

// ROUTE: 3 - Update and edit notes using: PUT "/api/notes/updatenote/:id".login required.

router.put("/updatenote/:id", fetchuser, async (req, res) => {

  const { title, description, tag } = req.body;

  try {
    //  Create a new note object

    const newNote = {};

    if (title) {
      newNote.title = title;
    }
    if (description) {
      newNote.description = description;
    }
    if (tag) {
      newNote.tag = tag;
    }

    //  Find the note to be updated and update it

    let note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).send("Note not found");
    }
    if (note.user.toString() !== req.user.id) {
      return res.status(401).send("Access denied!");
    }

    note = await Note.findByIdAndUpdate(
      req.params.id,
      { $set: newNote },
      { new: true }
    );

    res.json({ note });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server error");
  }
});

// ROUTE: 4 - Delete notes using: DELETE "/api/notes/deletenote/:id".login required.

router.delete("/deletenote/:id", fetchuser, async (req, res) => {

  const { title, description, tag } = req.body;

  try {
    // find a note to delete and delete it

    let note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(400).send("Note not found");
    }

    // Allow the deletion only if user is verified

    if (note.user.toString() !== req.user.id) {
      return res.status(404).send("Access denied!");
    }

    note = await Note.findByIdAndDelete(req.params.id);
    res.json({ Success: "Note Deleted Successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server error");
  }
});

module.exports = router;

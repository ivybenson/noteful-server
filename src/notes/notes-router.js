const path = require("path");
const express = require("express");
const xss = require("xss");
const logger = require("../logger");
const NotesService = require("./notes-service");
const { getNotesValidationError } = require("./notes-validator");

const notesRouter = express.Router();
const bodyParser = express.json();

const serializeNotes = (notes) => ({
  id: notes.id,
  name: xss(notes.name),
  timestamp: notes.timestamp,
  folderid: xss(notes.folderid),
  content: xss(notes.content),
});

notesRouter
  .route("/")

  .get((req, res, next) => {
    NotesService.getAllNotes(req.app.get("db"))
      .then((notes) => {
        res.json(notes.map(serializeNotes));
      })
      .catch(next);
  })

  .post(bodyParser, (req, res, next) => {
    const { name, folderid, content } = req.body;
    const newNote = { name, content, folderid };

    for (const field of ["name", "content", "folderid"]) {
      if (!newNote[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send({
          error: { message: `'${field}' is required` },
        });
      }
    }

    const error = getNotesValidationError(newNote);

    if (error) return res.status(400).send(error);

    NotesService.insertNote(req.app.get("db"), newNote)
      .then((note) => {
        logger.info(`Note with id ${note.id} created.`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `${note.id}`))
          .json(serializeNotes(note));
      })
      .catch(next);
  });

notesRouter
  .route("/:note_id")

  .all((req, res, next) => {
    const { note_id } = req.params;
    NotesService.getById(req.app.get("db"), note_id)
      .then((note) => {
        if (!note) {
          logger.error(`Note with id ${note_id} not found.`);
          return res.status(404).json({
            error: { message: `Note Not Found` },
          });
        }

        res.note = note;
        next();
      })
      .catch(next);
  })

  .get((req, res) => {
    res.json(serializeNotes(res.note));
  })

  .delete((req, res, next) => {
    const { note_id } = req.params;
    NotesService.deleteNote(req.app.get("db"), note_id)
      .then((numRowsAffected) => {
        logger.info(`Note with id ${note_id} deleted.`);
        res.status(204).end();
      })
      .catch(next);
  })

  .patch(bodyParser, (req, res, next) => {
    const { name, content } = req.body;
    const noteToUpdate = { name, content };

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      logger.error(`Invalid update without required fields`);
      return res.status(400).json({
        error: {
          message: `Request body must content either 'name' or 'content'`,
        },
      });
    }

    const error = getNotesValidationError(noteToUpdate);

    if (error) return res.status(400).send(error);

    NotesService.updateNote(
      req.app.get("db"),
      req.params.folder_id,
      noteToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;

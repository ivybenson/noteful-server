const path = require("path");
const express = require("express");
const xss = require("xss");
const logger = require("../logger");
const NotefulService = require("./noteful-service");
const { getNotefulValidationError } = require("./noteful-validator");

const notefulRouter = express.Router();
const bodyParser = express.json();

const serializeFolders = (folders) => ({
  id: folders.id,
  name: xss(folders.name),
});

const serializeNotes = (notes) => ({
  id: notes.id,
  name: xss(notes.name),
  timestamp: notes.timestamp,
  folderid: xss(notes.folderid),
  content: xss(notes.content),
});

notefulRouter
  .route("/")

  .get((req, res, next) => {
    NotefulService.getNotefulFolders(req.app.get("db"))
      .then((folders) => {
        res.json(folders.map(serializeFolders));
      })
      .catch(next);
  })

  .get((req, res, next) => {
    NotefulService.getNotefulNotes(req.app.get("db"))
      .then((notes) => {
        res.json(notes.map(serializeNotes));
      })
      .catch(next);
  })

  .post(bodyParser, (req, res, next) => {
    const { name, content } = req.body;
    const newNotes = { name, content };

    for (const field of ["name", "content"]) {
      if (!newNotes[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send({
          error: { message: `'${field}' is required` },
        });
      }
    }

    const error = getNotefulValidationError(newNotes);

    if (error) return res.status(400).send(error);

    NotefulService.insertNotefulNotes(req.app.get("db"), newNotes)
      .then((notes) => {
        logger.info(`Note with id ${notes.id} created.`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `${notes.id}`))
          .json(serializeNotes(notes));
      })
      .catch(next);
  });

notefulRouter.post(bodyParser, (req, res, next) => {
  const { name } = req.body;
  const newFolders = { name };

  for (const field of ["name"]) {
    if (!newFolders[field]) {
      logger.error(`${field} is required`);
      return res.status(400).send({
        error: { message: `'${field}' is required` },
      });
    }
  }

  const error = getNotefulValidationError(newFolders);

  if (error) return res.status(400).send(error);

  NotefulService.insertNotefulFolders(req.app.get("db"), newFolders)
    .then((folders) => {
      logger.info(`Note with id ${folders.id} created.`);
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `${folders.id}`))
        .json(serializeFolders(folders));
    })
    .catch(next);
});

notefulRouter
  .route("/:folderid")

  .all((req, res, next) => {
    const { folderid } = req.params;
    NotefulService.getFoldersById(req.app.get("db"), folderid)
      .then((folders) => {
        if (!folders) {
          logger.error(`Folder with id ${folderid} not found.`);
          return res.status(404).json({
            error: { message: `Folder Not Found` },
          });
        }

        res.folders = folders;
        next();
      })
      .catch(next);
  })

  .get((req, res) => {
    res.json(serializeFolders(res.folders));
  })

  .delete((req, res, next) => {
    const { folderid } = req.params;
    NotefulService.deleteNotefulFolders(req.app.get("db"), folderid)
      .then((numRowsAffected) => {
        logger.info(`Folder with id ${folderid} deleted.`);
        res.status(204).end();
      })
      .catch(next);
  })

  .patch(bodyParser, (req, res, next) => {
    const { name } = req.body;
    const folderToUpdate = { name };

    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      logger.error(`Invalid update without required fields`);
      return res.status(400).json({
        error: {
          message: `Request body must contain 'name'.`,
        },
      });
    }

    const error = getNotefulValidationError(folderToUpdate);

    if (error) return res.status(400).send(error);

    NotefulService.updateNotefulFolders(
      req.app.get("db"),
      req.params.folderid,
      folderUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

notefulRouter
  .route("/:noteid")

  .all((req, res, next) => {
    const { id } = req.params;
    NotefulService.getNotesById(req.app.get("db"), id)
      .then((notes) => {
        if (!notes) {
          logger.error(`Note with id ${id} not found.`);
          return res.status(404).json({
            error: { message: `Note Not Found` },
          });
        }

        res.notes = notes;
        next();
      })
      .catch(next);
  })

  .get((req, res) => {
    res.json(serializeNotes(res.notes));
  })

  .delete((req, res, next) => {
    const { id } = req.params;
    NotefulService.deleteNotefulNotes(req.app.get("db"), id)
      .then((numRowsAffected) => {
        logger.info(`Note with id ${id} deleted.`);
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
          message: `Request body must contain 'name' and 'content'.`,
        },
      });
    }

    const error = getNotefulValidationError(noteToUpdate);

    if (error) return res.status(400).send(error);

    NotefulService.updateNotefulNotes(
      req.app.get("db"),
      req.params.id,
      noteToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notefulRouter;

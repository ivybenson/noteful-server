const NotefulService = {
  getNotefulFolders(knex) {
    return knex.select("*").from("folders");
  },
  getNotefulNotes(knex) {
    return knex.select("*").from("notes");
  },
  getFoldersById(knex, id) {
    return knex.from("folders").select("*").where("id", id).first();
  },
  getNotesById(knex, id) {
    return knex.from("notes").select("*").where("id", id).first();
  },
  insertNotefulFolders(knex, newNotefulFolders) {
    return knex
      .insert(newNotefulFolders)
      .into("folders")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },
  insertNotefulNotes(knex, newNotefulNotes) {
    return knex
      .insert(newNotefulNotes)
      .into("folders")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },
  deleteNotefulFolders(knex, id) {
    return knex("folders").where({ id }).delete();
  },
  deleteNotefulNotes(knex, id) {
    return knex("notes").where({ id }).delete();
  },
  updateNotefulFolders(knex, id, newFoldersFields) {
    return knex("folders").where({ id }).update(newFoldersFields);
  },
  updateNotefulNotes(knex, id, newNotesFields) {
    return knex("notes").where({ id }).update(newNotesFields);
  },
};

module.exports = NotefulService;

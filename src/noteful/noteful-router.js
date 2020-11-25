const NotefulService = {
  getNotefulFolders(knex) {
    return knex.select("*").from("folders");
  },
  getById(knex, id) {
    return knex.from("folders").select("*").where("id", id).first();
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
  deleteNotefulFolders(knex, id) {
    return knex("folders").where({ id }).delete();
  },
  updateNotefulFolders(knex, id, newBookmarkFields) {
    return knex("folders").where({ id }).update(newBookmarkFields);
  },
};

module.exports = NotefulService;

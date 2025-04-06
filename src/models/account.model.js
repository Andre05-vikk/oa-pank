const { getById, deleteById } = require('../config/database');

class Account {
  static async findById(id) {
    return await getById('accounts', id);
  }

  static async findByIdAndDelete(id) {
    return await deleteById('accounts', id);
  }
}

module.exports = { Account };
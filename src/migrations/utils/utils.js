exports.addDateCreated = function(tableName) {
    return "ALTER TABLE " + tableName + " ADD COLUMN dateCreated DATETIME DEFAULT CURRENT_TIMESTAMP";
};

exports.addDateModified = function(tableName) {
    return "ALTER TABLE " + tableName + " ADD COLUMN dateModified DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
};

exports.dropColumn = function(tableName, columnName) {
    return "ALTER TABLE " + tableName + " DROP COLUMN " + columnName;
};

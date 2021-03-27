class UserManager {
  static avalibleID = 0;
  static userList = {};

  static registerMe(newUser) {
    const handleID = this.avalibleID++;
    this.userList[handleID] = newUser;
    return handleID;
  }

  static getUserByHandleID(handleID) {
    return this.userList[handleID];
  }

  static unRegisterMe(handleID) {
    delete this.userList[handleID];
    console.log(this.userList);
    return true;
  }
}

module.exports = UserManager;

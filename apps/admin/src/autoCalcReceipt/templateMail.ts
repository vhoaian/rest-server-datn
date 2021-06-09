export default {
  createMailLockAccount(username: string): string {
    return `
    Hi ${username},
    
    Your account has been locked for late payment of the application fee. Please contact the administrator to resolve this issue.
    
    Thank you,
    FlashFood`;
  },
};

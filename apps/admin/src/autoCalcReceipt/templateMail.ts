export default {
  createMailLockAccount(username: string): string {
    return `
    Hi ${username},
    
    Your account has been locked for late payment of the application fee. Please contact the administrator to resolve this issue.
    
    Thank you,
    FlashFood`;
  },

  createMailLockAccountVN(username: string): string {
    return `
    Chào ${username},
    
    Tài khoản của bạn tạm thời bị khóa do bạn chậm thanh toán phí app cho chúng tôi. Vui lòng liên hệ với chúng tối để giải quyết vấn đề này.
    
    Trân trọng,
    FlashFood`;
  },

  createMailWithMess(username: string, message: string): string {
    return `
    Hi ${username},
    
    ${message}
    
    Thank you,
    FlashFood`;
  },

  createMailWithMessVN(username: string, message: string): string {
    return `
    Chào ${username},
    
    ${message}
    
    Trân trọng,
    FlashFood`;
  },
};

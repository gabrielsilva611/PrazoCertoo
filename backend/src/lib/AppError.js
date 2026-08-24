class AppError extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

module.exports = AppError;

export class ApiResponse {
  static success(message: string, data?: any) {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, errors: any = null) {
    return {
      success: false,
      message,
      errors,
    };
  }
}

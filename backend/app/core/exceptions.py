from fastapi import Request
from fastapi.responses import JSONResponse

class AppException(Exception):
    def __init__(self, status_code: int, detail: str, error_code: str = None):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code

class NotFoundException(AppException):
    def __init__(self, detail: str = "Not Found", error_code: str = "NOT_FOUND"):
        super().__init__(404, detail, error_code)

class ForbiddenException(AppException):
    def __init__(self, detail: str = "Forbidden", error_code: str = "FORBIDDEN"):
        super().__init__(403, detail, error_code)

class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Unauthorized", error_code: str = "UNAUTHORIZED"):
        super().__init__(401, detail, error_code)

class ValidationException(AppException):
    def __init__(self, detail: str = "Validation Error", error_code: str = "VALIDATION_ERROR"):
        super().__init__(422, detail, error_code)

class ConflictException(AppException):
    def __init__(self, detail: str = "Conflict", error_code: str = "CONFLICT"):
        super().__init__(409, detail, error_code)

class RateLimitException(AppException):
    def __init__(self, detail: str = "Too Many Requests", error_code: str = "RATE_LIMIT_EXCEEDED"):
        super().__init__(429, detail, error_code)

def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "data": None, "message": exc.detail, "meta": None}
    )

def register_exception_handlers(app):
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(NotFoundException, app_exception_handler)
    app.add_exception_handler(ForbiddenException, app_exception_handler)
    app.add_exception_handler(UnauthorizedException, app_exception_handler)
    app.add_exception_handler(ValidationException, app_exception_handler)
    app.add_exception_handler(ConflictException, app_exception_handler)
    app.add_exception_handler(RateLimitException, app_exception_handler)

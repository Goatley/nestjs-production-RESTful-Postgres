export class InsufficientPermissionError extends Error {
  code: string;

  constructor(message?: string) {
    super(
      message || 'You have insufficient permissions to access this resource',
    );
    //this allows errors to reference the error name vs genereic 'Error" class in stack trace
    this.name = this.constructor.name;
    this.code = 'heeh';
  }
}

export class ActionNotAllowedError extends Error {
  code: string;

  constructor(message?: string) {
    super(message || 'This action is restricted and not allowed.');
    //this allows errors to reference the error name vs genereic 'Error" class in stack trace
    this.name = this.constructor.name;
  }
}

export class ResourceNotFoundError extends Error {
  code: string;

  constructor(message?: string) {
    super(message || 'This resource was not found.');
    //this allows errors to reference the error name vs the generic 'Error' class in stack trace
    this.name = this.constructor.name;
  }
}

export class ParametersRequiredError extends Error {
  code: string;

  constructor(message?: string) {
    super(message || 'Required parameters for this operation were not found.');
    //this allows errors to reference the error name vs the generic 'Error' class in stack trace
    this.name = this.constructor.name;
  }
}

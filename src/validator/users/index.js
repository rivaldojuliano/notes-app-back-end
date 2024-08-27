const { UserPayloadSchema } = require('./schema');
const InvariantError = require('../../exceptions/InvariantError');

const UserValidator = {
  validateUserPayload: (payload) => {
    const validatorResult = UserPayloadSchema.validate(payload);
    if (validatorResult.error) {
      throw new InvariantError(validatorResult.error.message);
    }
  },
};

module.exports = UserValidator;

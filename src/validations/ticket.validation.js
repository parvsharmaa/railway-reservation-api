const Joi = require('joi');

const bookTicketSchema = Joi.object({
  trainId: Joi.number().integer().positive().required(),
  passengers: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(2).max(100).required(),
        age: Joi.number().integer().min(1).max(120).required(),
        gender: Joi.string().valid('male', 'female', 'other').required(),
        berthPreference: Joi.string()
          .valid('lower', 'upper', 'middle', 'none')
          .optional(),
        isWithChild: Joi.boolean().default(false),
      })
    )
    .min(1)
    .max(6)
    .required(),
});

module.exports = {
  bookTicketSchema,
};

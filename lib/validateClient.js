import validator from 'validator'

export function validateClient(client) {
  if (!client.name) {
    return 'Name is required'
  }

  if (!client.email) {
    return 'Email is required'
  }

  if (!validator.isEmail(client.email)) {
    return 'Invalid email'
  }

  return null
}
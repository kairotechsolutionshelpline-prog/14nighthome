const memoryStore = new Map()

export function rateLimit({
  interval = 60 * 1000,
  limit = 10,
} = {}) {
  return (req, res, next) => {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'unknown'

    const now = Date.now()

    if (!memoryStore.has(ip)) {
      memoryStore.set(ip, {
        count: 1,
        start: now,
      })

      return next()
    }

    const data = memoryStore.get(ip)

    if (now - data.start > interval) {
      memoryStore.set(ip, {
        count: 1,
        start: now,
      })

      return next()
    }

    data.count += 1

    if (data.count > limit) {
      return res.status(429).json({
        error: 'Too many requests',
      })
    }

    next()
  }
}

import type { RouterConfig } from 'nuxt/schema'

export default {
  routes: (_routes) => _routes.map((r) => {
    switch (r.path) {
      case '/': r.name = 'home'; break
      case '/login': r.name = 'login'; break
      case '/dashboard': r.name = 'dashboard'; break
      case '/room': r.name = 'room'; break
      case '/room/:id': r.name = 'room-id'; break
      case '/projector': r.name = 'projector'; break
      case '/report': r.name = 'report'; break
      case '/pengaturan': r.name = 'pengaturan'; break
    }
    return r
  }),
} satisfies RouterConfig

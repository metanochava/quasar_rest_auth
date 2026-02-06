import { tdc } from '../boot/base'

export let restRoutes = [
  { 
    path: '/Teste', 
    name: 'list_test', 
    component: () => import('../components/MyTest.vue'), 
    meta: { 
      title: tdc('Lista de') + ' ' + tdc('Tests'), 
      requiresAuth: true, 
      requiredRole: 'list_test' 
    } 
  },
  { 
    path: '/view_scaffold', 
    name: 'view_scaffold', 
    component: () => import('../pages/commands/ScaffoldPage.vue'), 
    meta: { 
      title: tdc('Vista de') + ' ' + tdc('Scaffold'), 
      requiresAuth: true, 
      requiredRole: 'view_scaffold'
    } 
  },
  { 
    path: '/add_modulo', 
    name: 'add_modulo', 
    component: () => import('../pages/commands/ModuloCreatePage.vue'), 
    meta: { 
      title: tdc('Add de') + ' ' + tdc('Modulo'), 
      requiresAuth: true, 
      icon: 'inventory_2',
      requiredRole: 'add_modulo'
    } 
  }
]


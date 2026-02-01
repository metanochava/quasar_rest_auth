import { tdc } from '../boot/app'

export const restRoutes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: { 
      path: '/Teste', 
      name: 'list_test', 
      component: () => import('../components/MyTest.vue'), 
      meta: { title: tdc('Lista de') + ' ' + tdc('Tests'), 
      requiresAuth: true, 
      requiredRole: 'list_test' } 
    },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: { 
      path: '/view_scaffold', 
      name: 'view_scaffold', 
      component: () => import('../pages/commands/ScaffoldPage.vue'), 
      meta: { title: tdc('Vista de') + ' ' + tdc('Scaffold'), 
      requiresAuth: true, 
      requiredRole: 'view_scaffold' } 
    },
  },
]


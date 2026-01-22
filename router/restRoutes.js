import { tdc } from '../boot/app'

export const restRoutes = {
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
}

import { tdc } from '../boot/app'


export const authRoutes = {
  path: '/',
  component: () => import('../layouts/AuthLayout.vue'),
  children: [
    { path: 'login', component: () => import('../pages/auth/LoginPage.vue'), name: 'login' },
  ],
}
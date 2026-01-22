


export const authRoutes = [
  {
  path: '/',
  component: () => import('../layouts/AuthLayout.vue'),
  children: [
    { path: 'login', component: () => import('../pages/auth/LoginPage.vue'), name: 'login' },
  ],
},
{
    path: '/',
    component: () => import('../layouts/AuthLayout.vue'),
    children: [{ path: '/welcome', component: () => import('pages/WelcomePage.vue'), name: 'welcome' }],
  },
]
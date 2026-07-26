import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/product/:productId',
    name: 'product',
    component: () => import('@/views/ProductView.vue'),
  },
  {
    path: '/checkout/:productId/payment',
    name: 'payment',
    component: () => import('@/views/PaymentView.vue'),
  },
  {
    path: '/checkout/:productId/summary',
    name: 'summary',
    component: () => import('@/views/SummaryView.vue'),
  },
  {
    path: '/checkout/:productId/result',
    name: 'result',
    component: () => import('@/views/ResultView.vue'),
  },
  {
    // Root route redirects to a default product (adjust to the actual seed ID)
    path: '/',
    redirect: '/product/prod-002',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

import { API_ROUTES } from './constants';

export type TApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES];
